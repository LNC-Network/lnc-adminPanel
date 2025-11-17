// Email service using Resend (https://resend.com)
// Install: bun add resend

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  scheduledFor?: Date;
  sentBy?: string;
}

interface TemplateVariables {
  [key: string]: string | string[] | number | boolean;
}

/**
 * Send an email using a template
 */
export async function sendTemplateEmail(
  templateName: string,
  to: string,
  variables: TemplateVariables,
  options?: {
    toName?: string;
    scheduledFor?: Date;
    sentBy?: string;
  }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    // Get template from database
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', templateName)
      .single();

    if (templateError || !template) {
      console.error('Template not found:', templateName);
      return { success: false, error: 'Template not found' };
    }

    // Replace variables in subject and body
    let subject = template.subject;
    let htmlBody = template.body_html;
    let textBody = template.body_text || '';

    // Simple template variable replacement
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      const arrayPlaceholder = new RegExp(`{{#each ${key}}}([\\s\\S]*?){{/each}}`, 'g');
      
      subject = subject.replace(placeholder, String(value));
      
      // Handle arrays in HTML
      if (Array.isArray(value)) {
        htmlBody = htmlBody.replace(arrayPlaceholder, (_match: string, template: string) => {
          return value.map(item => template.replace('{{this}}', item)).join('');
        });
      } else {
        htmlBody = htmlBody.replace(placeholder, String(value));
      }
      
      textBody = textBody.replace(placeholder, String(value));
    });

    // Handle conditional blocks {{#if variable}}...{{/if}}
    htmlBody = htmlBody.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (_match: string, key: string, content: string) => {
      return variables[key] ? content : '';
    });

    // Send email
    return await sendEmail({
      to,
      toName: options?.toName,
      subject,
      html: htmlBody,
      text: textBody,
      templateId: template.id,
      templateVariables: variables,
      scheduledFor: options?.scheduledFor,
      sentBy: options?.sentBy,
    });
  } catch (error) {
    console.error('Error sending template email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send a custom email
 */
export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean;
  emailId?: string;
  error?: string;
}> {
  try {
    const fromEmail = process.env.EMAIL_FROM || 'noreply@lnc.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'LNC Admin Panel';

    // Add to email queue
    const { data: queueEntry, error: queueError } = await supabase
      .from('email_queue')
      .insert({
        to_email: options.to,
        to_name: options.toName,
        from_email: fromEmail,
        from_name: fromName,
        subject: options.subject,
        body_html: options.html,
        body_text: options.text,
        template_id: options.templateId,
        template_variables: options.templateVariables,
        scheduled_for: options.scheduledFor,
        sent_by: options.sentBy,
        status: options.scheduledFor ? 'pending' : 'pending',
      })
      .select()
      .single();

    if (queueError) {
      console.error('Error adding to queue:', queueError);
      return { success: false, error: queueError.message };
    }

    // Log event
    await logEmailEvent(queueEntry.id, 'queued', { to: options.to });

    // If not scheduled, send immediately
    if (!options.scheduledFor) {
      return await sendQueuedEmail(queueEntry.id);
    }

    return { success: true, emailId: queueEntry.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send a queued email
 */
async function sendQueuedEmail(queueId: string): Promise<{
  success: boolean;
  emailId?: string;
  error?: string;
}> {
  try {
    // Get email from queue
    const { data: email, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('id', queueId)
      .single();

    if (fetchError || !email) {
      return { success: false, error: 'Email not found in queue' };
    }

    // Update status to sending
    await supabase
      .from('email_queue')
      .update({ status: 'sending' })
      .eq('id', queueId);

    await logEmailEvent(queueId, 'sending', {});

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: `${email.from_name} <${email.from_email}>`,
      to: email.to_name ? `${email.to_name} <${email.to_email}>` : email.to_email,
      subject: email.subject,
      html: email.body_html,
      text: email.body_text,
    });

    if (error) {
      // Mark as failed
      await supabase
        .from('email_queue')
        .update({
          status: email.retry_count < email.max_retries ? 'retry' : 'failed',
          error_message: error.message,
          retry_count: email.retry_count + 1,
        })
        .eq('id', queueId);

      await logEmailEvent(queueId, 'failed', { error: error.message });
      return { success: false, error: error.message };
    }

    // Mark as sent
    await supabase
      .from('email_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', queueId);

    await logEmailEvent(queueId, 'sent', { resendId: data?.id });

    return { success: true, emailId: queueId };
  } catch (error) {
    console.error('Error in sendQueuedEmail:', error);
    
    // Update retry count
    await supabase.rpc('increment_email_retry', { email_id: queueId });
    
    return { success: false, error: String(error) };
  }
}

/**
 * Log email event
 */
async function logEmailEvent(
  emailQueueId: string,
  eventType: string,
  eventData: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('email_logs').insert({
      email_queue_id: emailQueueId,
      event_type: eventType,
      event_data: eventData,
    });
  } catch (error) {
    console.error('Error logging email event:', error);
  }
}

/**
 * Process pending emails (call this from a cron job or API route)
 */
export async function processPendingEmails(): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  let processed = 0;
  let successful = 0;
  let failed = 0;

  try {
    // Get pending emails that are due to be sent
    const { data: pendingEmails, error } = await supabase
      .from('email_queue')
      .select('id')
      .in('status', ['pending', 'retry'])
      .or('scheduled_for.is.null,scheduled_for.lte.' + new Date().toISOString())
      .lt('retry_count', 3)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error fetching pending emails:', error);
      return { processed, successful, failed };
    }

    // Process each email
    for (const email of pendingEmails || []) {
      processed++;
      const result = await sendQueuedEmail(email.id);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { processed, successful, failed };
  } catch (error) {
    console.error('Error processing pending emails:', error);
    return { processed, successful, failed };
  }
}

/**
 * Get email queue status
 */
export async function getEmailQueueStatus(): Promise<{
  pending: number;
  sent: number;
  failed: number;
  retry: number;
}> {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .select('status');

    if (error) {
      console.error('Error getting queue status:', error);
      return { pending: 0, sent: 0, failed: 0, retry: 0 };
    }

    const status = {
      pending: 0,
      sent: 0,
      failed: 0,
      retry: 0,
    };

    data?.forEach((email: any) => {
      if (email.status in status) {
        status[email.status as keyof typeof status]++;
      }
    });

    return status;
  } catch (error) {
    console.error('Error getting queue status:', error);
    return { pending: 0, sent: 0, failed: 0, retry: 0 };
  }
}

// Helper functions for common email scenarios

export async function sendWelcomeEmail(
  email: string,
  name: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  return await sendTemplateEmail('welcome', email, {
    name,
    email,
    role,
    loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
  }, { toName: name });
}

export async function sendRegistrationApprovedEmail(
  email: string,
  name: string,
  role: string,
  team: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 Attempting to send approval email to: ${email}`);
    
    // Send directly via Resend without database dependency
    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME || 'LNC Admin'} <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: email,
      subject: '✅ Your LNC Admin Account Has Been Approved!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .badge {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                margin: 10px 0;
              }
              .button {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
              }
              .info-box {
                background: white;
                padding: 15px;
                border-left: 4px solid #10b981;
                margin: 15px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Account Approved!</h1>
              </div>
              <div class="content">
                <p>Hello ${name},</p>
                
                <p>Great news! Your registration for the LNC Admin Panel has been approved.</p>
                
                <div class="info-box">
                  <strong>Account Details:</strong><br>
                  <strong>Email:</strong> ${email}<br>
                  <strong>Role:</strong> <span class="badge">${role}</span><br>
                  <strong>Team:</strong> ${team}
                </div>
                
                <p>You can now log in to the LNC Admin Panel using your credentials.</p>
                
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login" class="button">Login Now</a>
                </div>
                
                <p><small>If the button doesn't work, copy and paste this link into your browser:<br>
                ${process.env.NEXT_PUBLIC_SITE_URL}/login</small></p>
                
                <p>If you have any questions, please contact your administrator.</p>
                
                <p>Best regards,<br>LNC Admin Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send approval email:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Approval email sent successfully! Email ID: ${data?.id}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending approval email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendRegistrationRejectedEmail(
  email: string,
  name: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 Attempting to send rejection email to: ${email}`);
    
    // Send directly via Resend without database dependency
    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME || 'LNC Admin'} <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: email,
      subject: 'LNC Admin Registration Update',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .info-box {
                background: white;
                padding: 15px;
                border-left: 4px solid #ef4444;
                margin: 15px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Registration Update</h1>
              </div>
              <div class="content">
                <p>Hello ${name},</p>
                
                <p>Thank you for your interest in the LNC Admin Panel.</p>
                
                <p>Unfortunately, your registration request has not been approved at this time.</p>
                
                ${reason ? `
                <div class="info-box">
                  <strong>Reason:</strong><br>
                  ${reason}
                </div>
                ` : ''}
                
                <p>If you believe this was an error or have questions, please contact your administrator.</p>
                
                <p>Best regards,<br>LNC Admin Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send rejection email:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Rejection email sent successfully! Email ID: ${data?.id}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending rejection email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendTicketAssignedEmail(
  email: string,
  assigneeName: string,
  ticketData: {
    number: number;
    title: string;
    priority: string;
    status: string;
    description: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const priorityColors: Record<string, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    urgent: '#dc2626',
  };

  return await sendTemplateEmail('ticket_assigned', email, {
    assigneeName,
    ticketNumber: String(ticketData.number),
    ticketTitle: ticketData.title,
    priority: ticketData.priority,
    priorityColor: priorityColors[ticketData.priority.toLowerCase()] || '#6b7280',
    status: ticketData.status,
    description: ticketData.description,
    ticketUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?tab=tickets`,
  }, { toName: assigneeName });
}

export async function sendRoleChangedEmail(
  email: string,
  name: string,
  roles: string[]
): Promise<{ success: boolean; error?: string }> {
  return await sendTemplateEmail('role_changed', email, {
    name,
    roles,
    loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
  }, { toName: name });
}
