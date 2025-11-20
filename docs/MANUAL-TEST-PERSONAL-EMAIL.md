# Manual Test Instructions - Personal Email Workflow

## Step 1: Run SQL Migration

Go to Supabase SQL Editor and run:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_email TEXT;
CREATE INDEX IF NOT EXISTS idx_users_personal_email ON users(personal_email);
```

## Step 2: Test in UI

1. Open http://localhost:3000/dashboard
2. Go to **Database** tab
3. Find user `rohit@lnc.com`
4. Click the **Edit** button (pencil icon)
5. You should see:
   - Login Email (@lnc.com): `rohit@lnc.com`
   - **Personal Email (for notifications)**: [empty field]
   - Display Name: [current name]
   - Roles: [checkboxes]

## Step 3: Add Personal Email

1. In the "Personal Email" field, enter: `kundurohit53@gmail.com`
2. Click **Update User**
3. Should see success toast

## Step 4: Verify Database

Check Supabase users table:

```sql
SELECT id, email, personal_email, display_name
FROM users
WHERE email = 'rohit@lnc.com';
```

Should show:

- email: `rohit@lnc.com`
- personal_email: `kundurohit53@gmail.com`

## Step 5: Test Email Sending

When you update roles or any notification is sent, it should go to `kundurohit53@gmail.com` instead of `rohit@lnc.com`.

## Expected Results

✅ Personal email field visible in edit dialog
✅ Can save personal email
✅ Database updated correctly
✅ Emails sent to personal_email when set
