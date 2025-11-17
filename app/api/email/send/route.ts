// API route for sending test emails and managing email templates

import { NextResponse } from 'next/server';
import { sendTemplateEmail, sendEmail } from '@/lib/email-service';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Send a test email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, to, variables, subject, html, text } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    let result;

    if (type === 'template') {
      // Send using template
      const { templateName, ...templateVars } = variables;
      result = await sendTemplateEmail(templateName, to, templateVars);
    } else {
      // Send custom email
      if (!subject || !html) {
        return NextResponse.json(
          { error: 'Subject and HTML body are required for custom emails' },
          { status: 400 }
        );
      }

      result = await sendEmail({
        to,
        subject,
        html,
        text,
      });
    }

    if (result.success) {
      return NextResponse.json({
        message: 'Email sent successfully',
        emailId: result.emailId,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in email send API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get email templates
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const templateName = url.searchParams.get('template');

    if (templateName) {
      // Get specific template
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', templateName)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ template: data });
    } else {
      // Get all templates
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, name, subject, description, variables, created_at, updated_at')
        .order('name', { ascending: true });

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch templates' },
          { status: 500 }
        );
      }

      return NextResponse.json({ templates: data || [] });
    }
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
