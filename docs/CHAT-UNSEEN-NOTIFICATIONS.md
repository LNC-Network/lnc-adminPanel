# Chat Unseen Message Notification System

## Overview
WhatsApp-style notification system for chat messages with email alerts for messages left unseen for over 12 hours.

## Features

### 1. **Unseen Message Counter** 
- Real-time counter on each group showing number of unseen messages
- Blue badge (1-9 or "9+") displayed on groups with unseen messages
- Updates every 10 seconds automatically

### 2. **Navbar Notification Badge**
- Total unseen message count added to navbar notification bell
- Integrates with existing pending approvals and join requests
- Shows in notification dropdown with clickable link to chat

### 3. **Automatic Email Notifications**
- Sends email after messages remain unseen for 12+ hours
- Uses personal email (falls back to work email if not set)
- Includes message preview (up to 5 messages)
- Direct link to view messages
- Only sends once per message (tracked in database)

### 4. **Mark as Seen**
- Automatically marks messages as seen when user views a group
- Updates unseen count immediately
- Synchronized across all active sessions

## Database Schema

### New Tables
1. **chat_unseen_notifications** - Tracks which emails have been sent
2. **Modified chat_members** - Added `last_seen_at` timestamp column

### New Functions
1. **get_unseen_message_count(user_id, group_id)** - Counts unseen messages
2. **get_unseen_messages_older_than(hours)** - Finds messages to notify about

## API Endpoints

### GET /api/chat/unseen?user_id=UUID
Get unseen message count for user across all groups or specific group.

**Response:**
```json
{
  "total_unseen": 5,
  "groups": [
    { "group_id": "uuid", "unseen_count": 3 },
    { "group_id": "uuid", "unseen_count": 2 }
  ]
}
```

### POST /api/chat/unseen
Mark messages as seen for a specific group.

**Body:**
```json
{
  "user_id": "uuid",
  "group_id": "uuid"
}
```

### POST /api/chat/notify-unseen
**[CRON JOB ENDPOINT]** Send email notifications for old unseen messages.

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "notifications_sent": 5,
  "users_notified": 3
}
```

### GET /api/chat/notify-unseen?hours=12
**[TEST ENDPOINT]** Check which users would receive emails.

## Setup Instructions

### 1. Database Migration
Run these SQL scripts in Supabase SQL Editor:

```bash
# Add unseen tracking columns and functions
schemas/add-chat-unseen-tracking.sql

# Add email template
schemas/add-chat-email-template.sql
```

### 2. Environment Variables
Add to your `.env.local`:

```env
# Secret for cron job authentication
CRON_SECRET=your-random-secret-here

# App URL for email links
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. Set Up Cron Job

#### Option A: Vercel Cron Jobs (Recommended for Production)
Create `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/chat/notify-unseen",
    "schedule": "0 * * * *"
  }]
}
```

Add `CRON_SECRET` to Vercel environment variables.

#### Option B: External Cron Service (cron-job.org, EasyCron, etc.)
Set up hourly POST request:

```
URL: https://yourdomain.com/api/chat/notify-unseen
Method: POST
Headers: Authorization: Bearer YOUR_CRON_SECRET
Schedule: Every hour (0 * * * *)
```

#### Option C: Linux Crontab
```bash
# Edit crontab
crontab -e

# Add this line (runs every hour)
0 * * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/chat/notify-unseen
```

### 4. Verify Setup
Run the test script:

```bash
node testing/test-chat-unseen.js
```

## How It Works

### User Flow
1. User receives messages in a group
2. Unseen count badge appears on group (e.g., "3")
3. Navbar notification bell shows total unseen messages
4. User clicks on group → messages marked as seen automatically
5. Unseen count updates in real-time

### Email Notification Flow
1. Cron job runs every hour
2. Queries for messages unseen > 12 hours
3. Groups messages by user and group
4. Sends one email per user per group
5. Records email sent in `chat_unseen_notifications`
6. Won't send duplicate emails for same message

### Email Template Variables
```
- userName: Recipient's name
- groupName: Chat group name
- messageCount: Number of unseen messages
- messageList: Array of message previews (max 5)
- hasMore: Boolean if more than 5 messages
- moreCount: Count of additional messages
- chatUrl: Direct link to view messages
```

## Testing

### Test Unseen Count
```bash
# Get current unseen count
curl "http://localhost:3000/api/chat/unseen?user_id=USER_UUID"
```

### Test Mark as Seen
```bash
curl -X POST http://localhost:3000/api/chat/unseen \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USER_UUID","group_id":"GROUP_UUID"}'
```

### Test Email Notification (Without Sending)
```bash
# See which users would get emails
curl "http://localhost:3000/api/chat/notify-unseen?hours=1"
```

### Test Email Notification (Send Emails)
```bash
curl -X POST http://localhost:3000/api/chat/notify-unseen \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Run Full Test Suite
```bash
node testing/test-chat-unseen.js
```

## UI Components

### Chat Group List
- Shows blue badge with unseen count
- Updates every 10 seconds
- Badge disappears when messages viewed

### Navbar Notification
- Bell icon with red badge showing total count
- Includes unseen chat messages in dropdown
- Clickable to navigate to chat tab

### Notification Dropdown
```
Notifications
─────────────
Pending User Approvals (2)
• user@lnc.com - Requested: Nov 18
• another@lnc.com - Requested: Nov 17
─────────────
Chat Join Requests (1)
• user@lnc.com - Wants to join: Dev Team
─────────────
Unread Chat Messages (5)
• 💬 You have 5 unread messages
  Click to view your messages
```

## Performance Considerations

### Polling Intervals
- **Unseen counts**: Every 10 seconds (lightweight query)
- **Join requests**: Every 10 seconds (admin only)
- **Email check**: Every 1 hour (cron job)

### Database Optimization
- Indexed `last_seen_at` column for fast queries
- Composite index on `(user_id, group_id)` 
- Function-based counting (PostgreSQL optimized)

### Email Rate Limiting
- Maximum 1 email per message per user (tracked in DB)
- Only messages older than 12 hours
- Batched by user and group (one email per group)

## Troubleshooting

### Unseen count not updating
1. Check browser console for errors
2. Verify user is logged in (localStorage has user data)
3. Check that database migration ran successfully
4. Verify API endpoint `/api/chat/unseen` is accessible

### Email notifications not sending
1. Verify `CRON_SECRET` is set in environment
2. Check cron job is running (look for POST requests in logs)
3. Verify email template exists in database
4. Check `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set
5. Look for email sending errors in server logs

### Badge not showing
1. Check that `unseen_count` is in Group interface
2. Verify `fetchUnseenCounts()` is being called
3. Check browser console for CustomEvent 'chatUnseenCount'
4. Ensure component re-renders when state updates

### Navbar notification not updating
1. Check if event listener is attached in dashboard
2. Verify `chatUnseenCount` state exists
3. Check that CustomEvent is being dispatched from chat component
4. Look for any console errors in dashboard component

## Security

### Cron Job Protection
- Requires `Authorization: Bearer CRON_SECRET` header
- Returns 401 if secret doesn't match
- Keep secret private and rotate regularly

### Email Privacy
- Uses personal email when available
- Falls back to work email if needed
- Only shows message previews (100 chars max)
- Includes unsubscribe instructions in email

## Future Enhancements

- [ ] Per-group notification preferences
- [ ] Mute/unmute groups
- [ ] Custom notification schedules
- [ ] In-app push notifications
- [ ] Desktop notifications (Web Push API)
- [ ] Message read receipts
- [ ] Typing indicators
- [ ] @mentions with priority notifications

## Support

For issues or questions:
1. Check server logs for errors
2. Run test script: `node testing/test-chat-unseen.js`
3. Verify database migrations completed
4. Check API endpoint responses manually

## License

Part of LNC Admin Panel - Internal Tool
