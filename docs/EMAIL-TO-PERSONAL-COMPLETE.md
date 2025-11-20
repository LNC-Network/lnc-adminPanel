# Email System - Always Send to Personal Email

## ✅ Complete Implementation

All email notifications across the website now use the following logic:

```javascript
const emailTarget = user.personal_email || user.email;
```

This means:

- **First Priority**: Send to `personal_email` if it exists
- **Fallback**: Send to `email` if `personal_email` is not set

## Updated Endpoints

### 1. Role Change Notifications

**File**: `app/api/users/update-roles/route.ts`

- Fetches `email, personal_email, display_name`
- Sends to `personal_email || email`
- ✅ **DONE**

### 2. Chat Group Notifications

**File**: `app/api/chat/groups/route.ts`

- Fetches `email, personal_email, display_name`
- Sends to `personal_email || email`
- ✅ **ALREADY IMPLEMENTED**

### 3. Chat Message Notifications

**File**: `app/api/chat/messages/route.ts`

- Fetches `email, personal_email, display_name`
- Sends to `personal_email || email`
- ✅ **ALREADY IMPLEMENTED**

### 4. Registration Approval

**File**: `app/api/users/pending/route.ts`

- Uses `pendingUser.personal_email || pendingUser.email`
- ✅ **ALREADY IMPLEMENTED**

### 5. Registration Rejection

**File**: `app/api/users/pending/route.ts`

- Uses `pendingUser.personal_email || pendingUser.email`
- ✅ **ALREADY IMPLEMENTED**

## Database Structure

### users table

```sql
- id: UUID
- email: TEXT (Login email, e.g., rohit@lnc.com)
- personal_email: TEXT (Real email, e.g., kundurohit53@gmail.com)
- display_name: TEXT
- password_hash: TEXT
- is_active: BOOLEAN
- created_at: TIMESTAMP
```

### pending_users table

```sql
- id: UUID
- email: TEXT (Login email)
- personal_email: TEXT (Real email)
- display_name: TEXT
- password_hash: TEXT
- team: TEXT
- status: TEXT (pending/approved/rejected)
- created_at: TIMESTAMP
```

## Email Flow Examples

### Example 1: User with Personal Email

```
Login Email: rohit@lnc.com
Personal Email: kundurohit53@gmail.com
→ All emails sent to: kundurohit53@gmail.com ✅
```

### Example 2: User without Personal Email

```
Login Email: example@lnc.com
Personal Email: (not set)
→ All emails sent to: example@lnc.com ✅
```

### Example 3: User with Real Email (Legacy)

```
Login Email: john@gmail.com
Personal Email: (not set)
→ All emails sent to: john@gmail.com ✅
```

## Test Case: Role Change for rohit@lnc.com

### Setup

1. User: `rohit@lnc.com`
2. Personal Email: `kundurohit53@gmail.com`
3. Current Role: `Super Admin`
4. New Role: `Admistater`

### Expected Behavior

1. Admin changes role from `Super Admin` to `Admistater`
2. System calls `/api/users/update-roles`
3. API fetches user data including `personal_email`
4. Email sent to: `kundurohit53@gmail.com` (NOT rohit@lnc.com)
5. Email subject: `🔄 Your LNC Admin Roles Have Been Updated`
6. Email contains: New role badge with "Admistater"

### Test Command

```bash
node testing/test-role-change-email.js
```

## Verification Checklist

✅ Registration form captures `personal_email`
✅ Pending users table stores `personal_email`
✅ Approval emails sent to `personal_email`
✅ Rejection emails sent to `personal_email`
✅ Users table has `personal_email` column
✅ User list API returns `personal_email`
✅ User edit dialog shows `personal_email` field
✅ Update profile API saves `personal_email`
✅ Role change emails sent to `personal_email`
✅ Chat group notifications sent to `personal_email`
✅ Chat message notifications sent to `personal_email`

## Benefits

1. **Demo Login Emails**: Users can use `@lnc.com` emails for login
2. **Real Notifications**: Receive emails at their actual Gmail/email
3. **Flexibility**: Works with both demo and real emails
4. **Backward Compatible**: Falls back to `email` if `personal_email` not set
5. **Admin Control**: Admins can update personal emails anytime

## All Email Types Covered

| Email Type            | Recipient Field           | Status |
| --------------------- | ------------------------- | ------ |
| Registration Approved | `personal_email ││ email` | ✅     |
| Registration Rejected | `personal_email ││ email` | ✅     |
| Role Changed          | `personal_email ││ email` | ✅     |
| New Group Created     | `personal_email ││ email` | ✅     |
| New Message Posted    | `personal_email ││ email` | ✅     |

## Gmail Configuration

Current SMTP: `latenighthacker6@gmail.com`

- All emails sent from this address
- All users receive at their `personal_email` or `email`
