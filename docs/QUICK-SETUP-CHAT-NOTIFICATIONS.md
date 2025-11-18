# Quick Setup Guide: Chat Unseen Notifications

## 🚀 Quick Start (5 minutes)

### Step 1: Run Database Migrations
Open Supabase SQL Editor and run these two files in order:

1. **Add unseen tracking**
```sql
-- Copy and paste content from:
schemas/add-chat-unseen-tracking.sql
```

2. **Add email template**
```sql
-- Copy and paste content from:
schemas/add-chat-email-template.sql
```

### Step 2: Add Environment Variable
Add to `.env.local`:

```env
CRON_SECRET=your-random-secret-string-here-make-it-long
```

Generate a secret:
```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32

# Option 3: Just use a long random string
# Example: chat_cron_secret_xyz123abc456_2024
```

### Step 3: Test It Works
```bash
# Test the API endpoints
node testing/test-chat-unseen.js
```

### Step 4: Set Up Cron Job (Choose One)

#### ⭐ Option A: Vercel (Recommended for Production)
1. Create `vercel.json` in project root:
```json
{
  "crons": [
    {
      "path": "/api/chat/notify-unseen",
      "schedule": "0 * * * *"
    }
  ]
}
```

2. Add `CRON_SECRET` to Vercel environment variables
3. Deploy to Vercel

#### Option B: cron-job.org (Free External Service)
1. Go to https://cron-job.org
2. Create account and add new cron job:
   - **URL**: `https://yourdomain.com/api/chat/notify-unseen`
   - **Method**: POST
   - **Schedule**: Every hour (`0 * * * *`)
   - **Headers**: 
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```

#### Option C: Local Development (Testing Only)
Create a simple script `scripts/run-cron.sh`:
```bash
#!/bin/bash
curl -X POST http://localhost:3000/api/chat/notify-unseen \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Run it manually or add to system crontab:
```bash
chmod +x scripts/run-cron.sh

# Add to crontab (runs every hour)
crontab -e
# Add line:
0 * * * * /path/to/your/project/scripts/run-cron.sh
```

## ✅ Verify Everything Works

### 1. Check Unseen Count in Chat
- Open chat section
- Send messages to a group (as another user)
- Blue badge with count should appear on the group
- Click the group → badge should disappear

### 2. Check Navbar Notification
- With unseen messages in chat
- Look at bell icon in top-right navbar
- Should show red badge with total count
- Click bell → should see "Unread Chat Messages (X)"

### 3. Test Email Notification
```bash
# Check which users would receive emails (without actually sending)
curl "http://localhost:3000/api/chat/notify-unseen?hours=1"

# Send test emails (requires CRON_SECRET)
curl -X POST http://localhost:3000/api/chat/notify-unseen \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📊 Features You'll See

### In Chat Groups List
```
┌──────────────────────────┐
│ 🔵 LNC DEV           [3] │ ← Blue badge shows 3 unseen
│    No description         │
├──────────────────────────┤
│ 👥 general               │ ← No badge (all seen)
│    general chat           │
└──────────────────────────┘
```

### In Navbar
```
🔔 Notifications [8] ← Total includes chat unseen
```

### In Notification Dropdown
```
Notifications
─────────────────────
Pending User Approvals (2)
• user@lnc.com
• another@lnc.com
─────────────────────
Unread Chat Messages (6)  ← Click to go to chat
• 💬 You have 6 unread messages
  Click to view your messages
```

### Email After 12 Hours
```
Subject: You have 3 unread messages in LNC DEV

Hi Admin,

You have 3 unread messages in the group LNC DEV.

Recent Messages:
┌─────────────────────────────────┐
│ user@lnc.com: Hey, can you...   │
│ dev@lnc.com: I pushed the...    │
│ test@lnc.com: The feature is... │
└─────────────────────────────────┘

[View Messages →]
```

## 🔧 Troubleshooting

### Badge not showing?
1. Open browser DevTools Console
2. Look for errors from `/api/chat/unseen`
3. Check that database migration ran (look for `last_seen_at` column)

### Navbar count not updating?
1. Check Console for CustomEvent errors
2. Refresh the page
3. Make sure you're on the dashboard page

### Emails not sending?
1. Verify `CRON_SECRET` matches in .env and cron job
2. Check server logs for errors
3. Verify Gmail SMTP is configured (`GMAIL_USER`, `GMAIL_APP_PASSWORD`)
4. Test cron endpoint manually with curl

### Need to test without waiting 12 hours?
Change the hours parameter:
```bash
# Check messages older than 5 minutes
curl "http://localhost:3000/api/chat/notify-unseen?hours=0.083"

# Send emails for messages older than 5 minutes
curl -X POST http://localhost:3000/api/chat/notify-unseen \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"hours": 0.083}'
```

## 📝 Next Steps

1. ✅ Run database migrations
2. ✅ Add CRON_SECRET to .env
3. ✅ Test with test script
4. ✅ Set up cron job
5. ✅ Send test message to verify badges work
6. ✅ Wait or test email notification
7. 🎉 Done!

## 💡 Tips

- **Personal Emails**: Users should add their `personal_email` in Settings to receive emails at their personal inbox
- **Mute Groups**: Feature coming soon - for now users see all unseen messages
- **Testing**: Use the test script regularly to verify system health
- **Monitoring**: Check cron job logs to ensure emails are being sent

## 🆘 Still Having Issues?

1. Check all API endpoints are accessible:
   ```bash
   curl http://localhost:3000/api/chat/unseen?user_id=test
   curl -X POST http://localhost:3000/api/chat/unseen \
     -H "Content-Type: application/json" \
     -d '{"user_id":"test","group_id":"test"}'
   ```

2. Verify database tables exist:
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM chat_unseen_notifications LIMIT 1;
   SELECT last_seen_at FROM chat_members LIMIT 1;
   ```

3. Check email template exists:
   ```sql
   SELECT name, subject FROM email_templates 
   WHERE name = 'chat_unseen_messages';
   ```

4. Review server logs for any errors
5. Run the full test suite: `node testing/test-chat-unseen.js`

---

**That's it!** You now have a WhatsApp-style notification system for your chat. 🎉
