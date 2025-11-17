# Email System Quick Setup

## 🚀 Quick Start (5 minutes)

### 1. Install Resend Package

```bash
bun add resend
```

### 2. Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Create a new API key
4. Copy the API key (starts with `re_`)

### 3. Add Environment Variables

Add to `.env.local`:

```env
# Resend API Key (required)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Email sender configuration (optional, has defaults)
EMAIL_FROM=noreply@lnc.com
EMAIL_FROM_NAME=LNC Admin Panel

# Cron job secret for processing queue (optional)
CRON_SECRET=your_random_secret_here

# Your site URL (for email links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Generate CRON_SECRET:**

```bash
openssl rand -hex 32
```

### 4. Set Up Database

Run in Supabase SQL Editor:

```sql
-- Copy and paste contents of setup-email-system.sql
```

This creates:

- ✅ `email_templates` table
- ✅ `email_queue` table
- ✅ `email_logs` table
- ✅ 6 default email templates

### 5. Verify Domain (Production Only)

For production:

1. Go to Resend dashboard
2. Add your domain (e.g., `lnc.com`)
3. Add DNS records as shown
4. Update `EMAIL_FROM` to use your domain

For development:

- Use Resend's test domain (already configured)
- Emails will work immediately

## ✅ Test It

### Test with API

**Send a test email:**

```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "custom",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello!</h1><p>This is a test email.</p>"
  }'
```

### Test Automated Emails

**1. Create a user** (Settings → Create User)

- User receives welcome email ✉️

**2. Approve a registration** (Settings → Pending Registrations)

- User receives approval email ✉️

**3. Update user roles** (Settings → Edit Roles)

- User receives role change notification ✉️

## 📊 Monitor Queue

**View queue status:**

```bash
curl http://localhost:3000/api/email/process \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Check Supabase:**

```sql
-- View recent emails
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 10;

-- Count by status
SELECT status, COUNT(*) FROM email_queue GROUP BY status;
```

## 🔧 Optional: Set Up Cron Job

For scheduled/retry emails, set up automated processing:

### Option 1: Vercel Cron (Recommended for Vercel)

Create `vercel.json`:

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

### Option 2: Manual Cron Job

Run every 5 minutes:

```bash
*/5 * * * * curl -X POST https://your-domain.com/api/email/process -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📧 Available Email Templates

The system includes 6 pre-built templates:

| Template                  | Trigger                              | Variables                         |
| ------------------------- | ------------------------------------ | --------------------------------- |
| **welcome**               | User created                         | name, email, role, loginUrl       |
| **registration_approved** | Registration approved                | name, email, role, team, loginUrl |
| **registration_rejected** | Registration rejected                | name, reason                      |
| **password_reset**        | Password reset (not implemented yet) | name, resetUrl, expiresIn         |
| **ticket_assigned**       | Ticket assigned (optional)           | assigneeName, ticketNumber, etc.  |
| **role_changed**          | Roles updated                        | name, roles, loginUrl             |

## 🎯 What's Automated

These emails send automatically:

✅ **Welcome Email** - When admin creates a user  
✅ **Approval Email** - When admin approves registration  
✅ **Rejection Email** - When admin rejects registration  
✅ **Role Change Email** - When admin updates user roles

## 📖 Full Documentation

See [EMAIL-SYSTEM.md](EMAIL-SYSTEM.md) for:

- Complete API reference
- Custom email sending
- Template customization
- Troubleshooting guide
- Advanced features

## ⚠️ Important Notes

1. **Free tier limits**: Resend free plan includes 100 emails/day
2. **Test domain**: Development emails work immediately with test domain
3. **Production domain**: Verify your domain before production use
4. **Error handling**: Emails don't block user operations if they fail
5. **Retry logic**: Failed emails automatically retry up to 3 times

## 🆘 Troubleshooting

**Emails not sending?**

1. Check `RESEND_API_KEY` is set correctly
2. Verify in Resend dashboard that API key is active
3. Check `email_queue` table for error messages
4. For production, verify domain DNS is set up

**Variables not replacing?**

- Variable names are case-sensitive
- Check `email_templates` table for available variables
- Use exact variable names: `{{name}}` not `{{Name}}`

**Need help?**
See [EMAIL-SYSTEM.md](EMAIL-SYSTEM.md) for detailed troubleshooting.
