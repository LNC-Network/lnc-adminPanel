# Personal Email Setup

## Overview

Users can now have separate login emails (@lnc.com demo emails) and real personal emails for receiving notifications.

## Database Changes

### 1. Run SQL Migration

Execute `database-add-personal-email.sql` in your Supabase SQL Editor:

```sql
-- Adds personal_email column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_email TEXT;
CREATE INDEX IF NOT EXISTS idx_users_personal_email ON users(personal_email);
```

## How It Works

### User Structure

```typescript
interface User {
  id: string;
  email: string; // Login email (e.g., john@lnc.com)
  personal_email?: string; // Real email for notifications
  display_name: string;
  roles: string[];
}
```

### Email Sending Priority

When sending notifications, the system will:

1. **First choice**: Send to `personal_email` if it exists
2. **Fallback**: Send to `email` if personal_email is not set

### Updated Components

#### 1. Database Tab - Edit User Dialog

- **Login Email**: The @lnc.com email used for authentication
- **Personal Email**: Real email address for receiving notifications
- **Display Name**: User's display name
- **Roles**: Multi-select checkboxes for role assignment

#### 2. API Endpoints Updated

- `/api/users/list` - Now returns `personal_email` field
- `/api/users/update-profile` - Now accepts and updates `personal_email`

#### 3. Email Services (Future Update Needed)

All email functions should be updated to use this logic:

```javascript
const emailToSend = user.personal_email || user.email;
```

### Email Functions to Update

These functions need to be modified to use personal_email:

- `sendRegistrationApprovedEmail()`
- `sendRegistrationRejectedEmail()`
- `sendRoleChangedEmail()`
- `sendNewGroupNotification()`
- `sendNewMessageNotification()`

## Usage Example

### Admin Panel Workflow

1. User registers with `john@lnc.com` (demo email)
2. Admin opens Database tab
3. Admin clicks Edit on the user
4. Admin enters real email: `john.doe@gmail.com` in "Personal Email" field
5. Saves changes
6. All notifications now go to `john.doe@gmail.com`

### User Table Example

| Login Email     | Personal Email       | Display Name | Roles              |
| --------------- | -------------------- | ------------ | ------------------ |
| example@lnc.com | real.admin@gmail.com | Admin User   | Super Admin        |
| john@lnc.com    | john.doe@gmail.com   | John Doe     | Design Team Member |
| sarah@lnc.com   | -                    | Sarah Smith  | Social Media Admin |

In this example:

- `example@lnc.com` receives emails at `real.admin@gmail.com`
- `john@lnc.com` receives emails at `john.doe@gmail.com`
- `sarah@lnc.com` receives emails at `sarah@lnc.com` (no personal email set)

## Migration Strategy

### For Existing Users

The SQL migration automatically:

1. Checks if email is NOT @lnc.com
2. If true, copies the email to personal_email
3. This preserves real emails that were used before

### For New Users

- Users register with @lnc.com emails
- Admins manually add personal_email when needed

## Next Steps

1. ✅ Run the SQL migration
2. ✅ Test editing a user and adding personal_email
3. 🔄 Update email service functions to use personal_email (optional - can be done later)
4. 🔄 Update registration flow to ask for personal email (optional)
