# Email System Documentation

## Overview

The LNC Admin Panel includes a comprehensive email notification system with:

- Template-based emails
- Email queue management
- Automated notifications for user events
- Integration with [Resend](https://resend.com) email service
- Retry logic for failed emails
- Email audit logs

## Features

✅ **Template Management** - Pre-built HTML email templates  
✅ **Email Queue** - Queue emails for later delivery  
✅ **Retry Logic** - Automatically retry failed emails  
✅ **Event Logging** - Track email status (queued, sent, failed)  
✅ **Automated Notifications** - Welcome, approval, rejection, role changes  
✅ **Custom Emails** - Send one-off emails without templates  
✅ **Scheduled Emails** - Schedule emails for future delivery

## Setup Instructions

### 1. Install Dependencies

```bash
bun add resend
```

### 2. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Create a new API key
3. Verify your domain or use Resend's test domain

### 3. Set Environment Variables

Add to `.env.local`:

```env
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email Configuration
EMAIL_FROM=noreply@lnc.com
EMAIL_FROM_NAME=LNC Admin Panel

# Cron job security (generate with: openssl rand -hex 32)
CRON_SECRET=your_random_secret_here

# Site URL for email links
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Database Migration

Execute in Supabase SQL Editor:

```bash
setup-email-system.sql
```

This creates:

- `email_templates` - Email template storage
- `email_queue` - Queued emails tracking
- `email_logs` - Email event audit trail
- Default templates (welcome, approval, rejection, etc.)

### 5. Set Up Cron Job (Optional)

For scheduled/retry emails, set up a cron job to call:

```
POST /api/email/process
Authorization: Bearer YOUR_CRON_SECRET
```

**Vercel Cron** (vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/email/process",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**GitHub Actions** (.github/workflows/email-cron.yml):

```yaml
name: Process Email Queue
on:
  schedule:
    - cron: "*/5 * * * *"
jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X POST https://your-domain.com/api/email/process \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Email Templates

### Available Templates

| Template Name           | Description           | Variables                                                                         |
| ----------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `welcome`               | New user creation     | name, email, role, loginUrl                                                       |
| `registration_approved` | Registration approved | name, email, role, team, loginUrl                                                 |
| `registration_rejected` | Registration rejected | name, reason                                                                      |
| `password_reset`        | Password reset link   | name, resetUrl, expiresIn                                                         |
| `ticket_assigned`       | Ticket assignment     | assigneeName, ticketNumber, ticketTitle, priority, status, description, ticketUrl |
| `role_changed`          | User role updated     | name, roles, loginUrl                                                             |

### Template Variables

Templates use `{{variable}}` syntax:

```html
<p>Hi {{name}},</p>
<p>Your email is: {{email}}</p>
```

**Arrays:**

```html
<ul>
  {{#each roles}}
  <li>{{this}}</li>
  {{/each}}
</ul>
```

**Conditionals:**

```html
{{#if reason}}
<p>Reason: {{reason}}</p>
{{/if}}
```

## Usage

### Send Template Email

```typescript
import { sendTemplateEmail } from "@/lib/email-service";

await sendTemplateEmail(
  "welcome",
  "user@example.com",
  {
    name: "John Doe",
    email: "user@example.com",
    role: "Dev Member",
    loginUrl: "https://admin.lnc.com/login",
  },
  {
    toName: "John Doe",
    sentBy: "admin-user-id", // optional
  }
);
```

### Send Custom Email

```typescript
import { sendEmail } from "@/lib/email-service";

await sendEmail({
  to: "user@example.com",
  toName: "John Doe",
  subject: "Important Update",
  html: "<h1>Hello!</h1><p>This is a custom email.</p>",
  text: "Hello! This is a custom email.",
});
```

### Send Scheduled Email

```typescript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

await sendTemplateEmail(
  "reminder",
  "user@example.com",
  { name: "John" },
  {
    scheduledFor: tomorrow,
  }
);
```

### Helper Functions

Pre-built helpers for common scenarios:

```typescript
import {
  sendWelcomeEmail,
  sendRegistrationApprovedEmail,
  sendRegistrationRejectedEmail,
  sendTicketAssignedEmail,
  sendRoleChangedEmail,
} from "@/lib/email-service";

// Welcome email
await sendWelcomeEmail("user@example.com", "John Doe", "dev member");

// Registration approved
await sendRegistrationApprovedEmail(
  "user@example.com",
  "John Doe",
  "dev member",
  "Development Team"
);

// Registration rejected
await sendRegistrationRejectedEmail(
  "user@example.com",
  "John Doe",
  "Email domain not allowed"
);

// Ticket assigned
await sendTicketAssignedEmail("dev@example.com", "Jane Smith", {
  number: 123,
  title: "Fix login bug",
  priority: "high",
  status: "open",
  description: "Users cannot log in...",
});

// Role changed
await sendRoleChangedEmail("user@example.com", "John Doe", [
  "dev team admin",
  "dev member",
]);
```

## API Endpoints

### Send Email

**POST** `/api/email/send`

```typescript
// Template email
{
  "type": "template",
  "to": "user@example.com",
  "variables": {
    "templateName": "welcome",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "dev member",
    "loginUrl": "https://admin.lnc.com/login"
  }
}

// Custom email
{
  "type": "custom",
  "to": "user@example.com",
  "subject": "Test Email",
  "html": "<p>Hello!</p>",
  "text": "Hello!"
}
```

### Get Templates

**GET** `/api/email/send?template=welcome`

Returns specific template or all templates.

### View Email Queue

**GET** `/api/email/queue?status=pending&limit=50&offset=0`

Query parameters:

- `status` - Filter by status (pending, sent, failed, retry)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

### Process Queue (Cron)

**POST** `/api/email/process`

Headers:

```
Authorization: Bearer YOUR_CRON_SECRET
```

Returns:

```json
{
  "message": "Email processing completed",
  "processed": 10,
  "successful": 9,
  "failed": 1
}
```

### Queue Status

**GET** `/api/email/process`

Headers:

```
Authorization: Bearer YOUR_CRON_SECRET
```

Returns:

```json
{
  "status": {
    "pending": 5,
    "sent": 100,
    "failed": 2,
    "retry": 1
  }
}
```

## Automated Notifications

The system automatically sends emails for:

### User Creation

When a super admin creates a user manually:

- ✉️ **Template:** `welcome`
- **Trigger:** POST `/api/users/create`
- **Content:** Welcome message with login link

### Registration Approved

When admin approves pending registration:

- ✉️ **Template:** `registration_approved`
- **Trigger:** PATCH `/api/users/pending` (action: approve)
- **Content:** Approval notification with role and team info

### Registration Rejected

When admin rejects pending registration:

- ✉️ **Template:** `registration_rejected`
- **Trigger:** PATCH `/api/users/pending` (action: reject)
- **Content:** Rejection notice with optional reason

### Role Changed

When admin updates user roles:

- ✉️ **Template:** `role_changed`
- **Trigger:** PATCH `/api/users/update-roles`
- **Content:** List of new roles assigned

### Ticket Assigned

When ticket is assigned to user (optional, implement in tickets API):

- ✉️ **Template:** `ticket_assigned`
- **Content:** Ticket details with priority and link

## Database Schema

### email_templates

| Column      | Type        | Description                |
| ----------- | ----------- | -------------------------- |
| id          | UUID        | Primary key                |
| name        | TEXT        | Unique template identifier |
| subject     | TEXT        | Email subject line         |
| body_html   | TEXT        | HTML email body            |
| body_text   | TEXT        | Plain text fallback        |
| variables   | JSONB       | Available variables array  |
| description | TEXT        | Template description       |
| created_at  | TIMESTAMPTZ | Creation timestamp         |
| updated_at  | TIMESTAMPTZ | Last update timestamp      |

### email_queue

| Column             | Type        | Description                     |
| ------------------ | ----------- | ------------------------------- |
| id                 | UUID        | Primary key                     |
| to_email           | TEXT        | Recipient email                 |
| to_name            | TEXT        | Recipient name                  |
| from_email         | TEXT        | Sender email                    |
| from_name          | TEXT        | Sender name                     |
| subject            | TEXT        | Email subject                   |
| body_html          | TEXT        | HTML body                       |
| body_text          | TEXT        | Plain text body                 |
| template_id        | UUID        | FK to email_templates           |
| template_variables | JSONB       | Template variables used         |
| status             | TEXT        | pending/sent/failed/retry       |
| error_message      | TEXT        | Error details if failed         |
| sent_at            | TIMESTAMPTZ | When email was sent             |
| created_at         | TIMESTAMPTZ | When queued                     |
| retry_count        | INTEGER     | Number of retry attempts        |
| max_retries        | INTEGER     | Max retry attempts (default: 3) |
| scheduled_for      | TIMESTAMPTZ | Scheduled send time             |
| sent_by            | UUID        | FK to users (who queued it)     |

### email_logs

| Column         | Type        | Description                               |
| -------------- | ----------- | ----------------------------------------- |
| id             | UUID        | Primary key                               |
| email_queue_id | UUID        | FK to email_queue                         |
| event_type     | TEXT        | queued/sending/sent/failed/opened/clicked |
| event_data     | JSONB       | Additional event data                     |
| created_at     | TIMESTAMPTZ | Event timestamp                           |

## Error Handling

The email system handles errors gracefully:

1. **Failed sends** - Marked as 'retry' status
2. **Max retries exceeded** - Marked as 'failed'
3. **Template not found** - Returns error, doesn't queue
4. **Invalid recipient** - Returns error immediately
5. **API integration errors** - Logged to email_logs

Errors **DO NOT** break user-facing operations:

- User creation succeeds even if welcome email fails
- Registration approval succeeds even if email fails
- Role updates succeed even if notification fails

## Monitoring

### Check Queue Status

```typescript
import { getEmailQueueStatus } from "@/lib/email-service";

const status = await getEmailQueueStatus();
console.log(status);
// { pending: 5, sent: 100, failed: 2, retry: 1 }
```

### View Failed Emails

```sql
SELECT * FROM email_queue
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### View Email Logs

```sql
SELECT
  eq.to_email,
  eq.subject,
  el.event_type,
  el.created_at
FROM email_logs el
JOIN email_queue eq ON el.email_queue_id = eq.id
WHERE eq.to_email = 'user@example.com'
ORDER BY el.created_at DESC;
```

## Best Practices

1. **Use Templates** - Create templates for repeated emails
2. **Test First** - Use Resend's test domain before production
3. **Monitor Queue** - Set up alerts for high failure rates
4. **Retry Logic** - Let the system retry failed emails automatically
5. **Graceful Degradation** - Don't fail operations if emails fail
6. **Audit Trail** - Use email_logs for compliance and debugging
7. **Rate Limiting** - Cron job includes 100ms delay between emails
8. **Unsubscribe** - Add unsubscribe links for marketing emails

## Troubleshooting

### Emails Not Sending

1. Check `RESEND_API_KEY` is set correctly
2. Verify domain is verified in Resend dashboard
3. Check email_queue for status='failed' and error_message
4. Ensure cron job is running (for scheduled emails)

### Template Variables Not Replacing

1. Check variable names match exactly (case-sensitive)
2. Ensure variables are passed as object: `{ name: 'John' }`
3. View email_queue.template_variables to see what was stored

### High Failure Rate

```sql
-- Check recent failures
SELECT error_message, COUNT(*) as count
FROM email_queue
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_message
ORDER BY count DESC;
```

Common causes:

- Invalid email addresses
- Resend API key expired/invalid
- Domain not verified
- Rate limits exceeded

## Future Enhancements

Planned features:

- [ ] Email click tracking
- [ ] Email open tracking
- [ ] Unsubscribe management
- [ ] Email templates in database (editable via UI)
- [ ] Bulk email sending
- [ ] Email attachments
- [ ] A/B testing for email templates
- [ ] Email analytics dashboard

## Support

For email system issues:

1. Check email_logs for error details
2. Review Resend dashboard for delivery status
3. Consult Resend documentation: https://resend.com/docs
