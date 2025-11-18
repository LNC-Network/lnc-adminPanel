-- Add Chat Unseen Messages Email Template
-- Run this in Supabase SQL Editor after setup-email-system.sql

INSERT INTO email_templates (name, subject, body_html, body_text, variables, description) VALUES
(
  'chat_unseen_messages',
  'You have {{messageCount}} unread messages in {{groupName}}',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
    <div style="background-color: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1f2937; margin: 0; font-size: 24px;">💬 Unread Messages</h1>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Hi <strong>{{userName}}</strong>,
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        You have <strong style="color: #2563eb;">{{messageCount}} unread message(s)</strong> in the group <strong>{{groupName}}</strong>.
      </p>
      
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Recent Messages:</p>
        {{#each messageList}}
          <div style="background-color: white; padding: 10px; border-radius: 6px; margin-bottom: 8px; font-size: 14px; color: #374151;">
            <p style="margin: 0; white-space: pre-wrap;">{{this}}</p>
          </div>
        {{/each}}
        {{#if hasMore}}
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 13px; font-style: italic;">
            ...and {{moreCount}} more message(s)
          </p>
        {{/if}}
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{chatUrl}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          View Messages
        </a>
      </div>
      
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
          You''re receiving this because you have unread messages from over 12 hours ago.<br>
          To stop receiving these notifications, please check your messages regularly.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 24px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          LNC Admin Panel - Chat System
        </p>
      </div>
    </div>
  </body></html>',
  'Hi {{userName}},

You have {{messageCount}} unread message(s) in {{groupName}}.

Recent messages:
{{#each messageList}}
- {{this}}
{{/each}}

{{#if hasMore}}...and {{moreCount}} more message(s){{/if}}

View your messages: {{chatUrl}}

---
You''re receiving this because you have unread messages from over 12 hours ago.
LNC Admin Panel - Chat System',
  '["userName", "groupName", "messageCount", "messageList", "hasMore", "moreCount", "chatUrl"]'::jsonb,
  'Notification sent when user has unread chat messages older than 12 hours'
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  variables = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at = NOW();

SELECT 'Chat unseen messages email template added successfully!' as message;
