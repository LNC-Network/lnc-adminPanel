// Email service using Gmail SMTP and Resend
// Install: bun add resend nodemailer

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Gmail SMTP transporter
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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

    let success = false;
    let errorMessage = '';

    // Try Resend first if configured
    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: `${email.from_name} <${email.from_email}>`,
          to: email.to_name ? `${email.to_name} <${email.to_email}>` : email.to_email,
          subject: email.subject,
          html: email.body_html,
          text: email.body_text,
        });

        if (!error) {
          success = true;
          await logEmailEvent(queueId, 'sent', { provider: 'resend', resendId: data?.id });
        } else {
          console.warn('Resend failed, falling back to Gmail:', error.message);
          errorMessage = error.message;
        }
      } catch (err: any) {
        console.warn('Resend error, falling back to Gmail:', err.message);
        errorMessage = err.message;
      }
    }

    // Fallback to Gmail if Resend failed or not configured
    if (!success && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        await gmailTransporter.sendMail({
          from: `${email.from_name} <${email.from_email}>`,
          to: email.to_name ? `${email.to_name} <${email.to_email}>` : email.to_email,
          subject: email.subject,
          html: email.body_html,
          text: email.body_text,
        });

        success = true;
        await logEmailEvent(queueId, 'sent', { provider: 'gmail' });
      } catch (err: any) {
        console.error('Gmail also failed:', err.message);
        errorMessage = errorMessage ? `${errorMessage}; Gmail: ${err.message}` : err.message;
      }
    }

    if (!success) {
      // Mark as failed
      await supabase
        .from('email_queue')
        .update({
          status: email.retry_count < email.max_retries ? 'retry' : 'failed',
          error_message: errorMessage || 'No email provider configured',
          retry_count: email.retry_count + 1,
        })
        .eq('id', queueId);

      await logEmailEvent(queueId, 'failed', { error: errorMessage });
      return { success: false, error: errorMessage || 'No email provider configured' };
    }

    // Mark as sent
    await supabase
      .from('email_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', queueId);

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

    // Send via Gmail SMTP
    await gmailTransporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME || 'LNC Admin'} <${process.env.GMAIL_USER}>`,
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

    console.log(`✅ Approval email sent successfully via Gmail!`);
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

    // Send via Gmail SMTP
    await gmailTransporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME || 'LNC Admin'} <${process.env.GMAIL_USER}>`,
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

    console.log(`✅ Rejection email sent successfully via Gmail!`);
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
  try {
    console.log(`📧 Attempting to send role change email to: ${email}`);

    const html = `
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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            .role-badge {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              margin: 5px;
            }
            .info-box {
              background: white;
              padding: 15px;
              border-left: 4px solid #667eea;
              margin: 15px 0;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Your Roles Have Been Updated</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              
              <p>Your roles in the LNC Admin Panel have been updated.</p>
              
              <div class="info-box">
                <strong>Your Current Roles:</strong><br>
                ${roles.map(role => `<span class="role-badge">${role}</span>`).join(' ')}
              </div>
              
              <p>These changes are effective immediately. Your access permissions have been updated accordingly.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login" class="button">Go to Dashboard</a>
              </div>
              
              <p>If you have any questions about your new roles, please contact your administrator.</p>
              
              <p>Best regards,<br>LNC Admin Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send via Gmail SMTP
    await gmailTransporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME || 'LNC Admin'} <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔄 Your LNC Admin Roles Have Been Updated',
      html,
    });

    console.log(`✅ Role change email sent successfully via Gmail!`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending role change email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 Attempting to send password reset OTP to: ${email}`);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; text-align: center; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for the LNC Admin Panel.</p>
              <p>Please use the following OTP (One-Time Password) to complete the process:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              
              <p>This code will expire in 15 minutes.</p>
              <p>If you did not request a password reset, please ignore this email.</p>
              
              <div class="footer">
                <p>LNC Admin Panel Secure System</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Use existing sendEmail helper which handles queuing
    return await sendEmail({
      to: email,
      subject: '🔒 LNC Admin: Password Reset OTP',
      html,
    });
  } catch (error: any) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendLoginNotificationEmail(
  email: string,
  details: {
    time: string;
    device: string;
    ip: string;
    location: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 Sending login notification to: ${email}`);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .detail-row { margin: 10px 0; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .detail-label { font-weight: bold; color: #555; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛡️ New Login Detected</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We detected a new login to your LNC Admin Panel account.</p>
              
              <div class="detail-row">
                <span class="detail-label">⏰ Time:</span> ${details.time}
              </div>
              <div class="detail-row">
                <span class="detail-label">📱 Device:</span> ${details.device}
              </div>
              <div class="detail-row">
                <span class="detail-label">📍 Location:</span> ${details.location}
              </div>
              <div class="detail-row">
                <span class="detail-label">🔒 IP Address:</span> ${details.ip}
              </div>

              <p>If this was you, you can safely ignore this email.</p>
              <p style="color: #d97706; font-weight: bold;">If you did not log in, please reset your password immediately.</p>
              
              <div class="footer">
                <p>LNC Admin Panel Secure System</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail({
      to: email,
      subject: '🛡️ LNC Admin: New Login Alert',
      html,
    });
  } catch (error: any) {
    console.error('❌ Error sending login notification:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordChangedEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 Sending password changed notification to: ${email}`);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Changed Successfully</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>This is a confirmation that the password for your LNC Admin Panel account has been changed on ${new Date().toLocaleString()}.</p>
              <p>If you did not perform this action, please contact your administrator immediately.</p>
              
              <div class="footer">
                <p>LNC Admin Panel Secure System</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail({
      to: email,
      subject: '✅ LNC Admin: Password Changed Successfully',
      html,
    });
  } catch (error: any) {
    console.error('❌ Error sending password changed email:', error);
    return { success: false, error: error.message };
  }
}
