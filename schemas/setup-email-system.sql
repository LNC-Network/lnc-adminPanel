-- Email System Database Schema
-- Run this in Supabase SQL Editor to set up the mailing system

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_queue table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  to_name TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  template_id UUID REFERENCES email_templates(id),
  template_variables JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retry')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_for TIMESTAMPTZ,
  sent_by UUID REFERENCES users(id)
);

-- Create email_logs table for audit trail
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_queue_id UUID REFERENCES email_queue(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('queued', 'sending', 'sent', 'failed', 'opened', 'clicked')),
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_to_email ON email_queue(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_queue_id ON email_logs(email_queue_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_event_type ON email_logs(event_type);

-- Insert default email templates
INSERT INTO email_templates (name, subject, body_html, body_text, variables, description)
VALUES 
(
  'welcome',
  'Welcome to LNC Admin Panel',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Welcome, {{name}}!</h1>
    <p>Your account has been created successfully.</p>
    <p><strong>Email:</strong> {{email}}</p>
    <p><strong>Role:</strong> {{role}}</p>
    <p>You can now log in to the admin panel using your credentials.</p>
    <a href="{{loginUrl}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Login Now</a>
    <p style="color: #666; font-size: 12px; margin-top: 40px;">This is an automated message from LNC Admin Panel.</p>
  </body></html>',
  'Welcome, {{name}}! Your account has been created successfully. Email: {{email}}, Role: {{role}}. Login at: {{loginUrl}}',
  '["name", "email", "role", "loginUrl"]'::jsonb,
  'Welcome email sent when new user is created'
),
(
  'registration_approved',
  'Your Registration has been Approved',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #16a34a;">Registration Approved!</h1>
    <p>Hi {{name}},</p>
    <p>Your registration request has been approved by our admin team.</p>
    <p><strong>Email:</strong> {{email}}</p>
    <p><strong>Assigned Role:</strong> {{role}}</p>
    <p><strong>Team:</strong> {{team}}</p>
    <p>You can now log in to access the admin panel.</p>
    <a href="{{loginUrl}}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Login to Dashboard</a>
    <p style="color: #666; font-size: 12px; margin-top: 40px;">Welcome to LNC Network!</p>
  </body></html>',
  'Hi {{name}}, Your registration has been approved! Role: {{role}}, Team: {{team}}. Login at: {{loginUrl}}',
  '["name", "email", "role", "team", "loginUrl"]'::jsonb,
  'Sent when admin approves a pending registration'
),
(
  'registration_rejected',
  'Registration Update',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #dc2626;">Registration Not Approved</h1>
    <p>Hi {{name}},</p>
    <p>We regret to inform you that your registration request could not be approved at this time.</p>
    {{#if reason}}
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0;">
      <p><strong>Reason:</strong></p>
      <p>{{reason}}</p>
    </div>
    {{/if}}
    <p>If you believe this is an error or have questions, please contact our support team.</p>
    <p style="color: #666; font-size: 12px; margin-top: 40px;">LNC Admin Panel</p>
  </body></html>',
  'Hi {{name}}, Your registration could not be approved. {{#if reason}}Reason: {{reason}}{{/if}}',
  '["name", "reason"]'::jsonb,
  'Sent when admin rejects a pending registration'
),
(
  'password_reset',
  'Reset Your Password',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Password Reset Request</h1>
    <p>Hi {{name}},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <a href="{{resetUrl}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
    <p>This link will expire in {{expiresIn}} hours.</p>
    <p>If you didn''t request this, please ignore this email.</p>
    <p style="color: #666; font-size: 12px; margin-top: 40px;">LNC Admin Panel Security</p>
  </body></html>',
  'Password reset requested. Visit: {{resetUrl}} (expires in {{expiresIn}} hours)',
  '["name", "resetUrl", "expiresIn"]'::jsonb,
  'Password reset email with temporary link'
),
(
  'ticket_assigned',
  'New Ticket Assigned to You',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">New Ticket Assignment</h1>
    <p>Hi {{assigneeName}},</p>
    <p>A new ticket has been assigned to you:</p>
    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Ticket #{{ticketNumber}}</strong></p>
      <p><strong>Title:</strong> {{ticketTitle}}</p>
      <p><strong>Priority:</strong> <span style="color: {{priorityColor}};">{{priority}}</span></p>
      <p><strong>Status:</strong> {{status}}</p>
      <p><strong>Description:</strong></p>
      <p>{{description}}</p>
    </div>
    <a href="{{ticketUrl}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Ticket</a>
    <p style="color: #666; font-size: 12px; margin-top: 40px;">LNC Ticket System</p>
  </body></html>',
  'New ticket assigned: #{{ticketNumber}} - {{ticketTitle}}. Priority: {{priority}}. View at: {{ticketUrl}}',
  '["assigneeName", "ticketNumber", "ticketTitle", "priority", "priorityColor", "status", "description", "ticketUrl"]'::jsonb,
  'Sent when a ticket is assigned to a team member'
),
(
  'role_changed',
  'Your Role has been Updated',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Role Update Notification</h1>
    <p>Hi {{name}},</p>
    <p>Your roles in the LNC Admin Panel have been updated.</p>
    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p><strong>New Roles:</strong></p>
      <ul>
        {{#each roles}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
    </div>
    <p>These changes will take effect on your next login.</p>
    <a href="{{loginUrl}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Login to Dashboard</a>
    <p style="color: #666; font-size: 12px; margin-top: 40px;">LNC Admin Panel</p>
  </body></html>',
  'Hi {{name}}, Your roles have been updated to: {{roles}}. Login at: {{loginUrl}}',
  '["name", "roles", "loginUrl"]'::jsonb,
  'Sent when user roles are modified'
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email_templates
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your setup)
-- GRANT SELECT, INSERT, UPDATE ON email_templates TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON email_queue TO authenticated;
-- GRANT SELECT, INSERT ON email_logs TO authenticated;

-- Verification queries
SELECT 'Email templates created:' as message, COUNT(*) as count FROM email_templates;
SELECT name, subject FROM email_templates ORDER BY name;
