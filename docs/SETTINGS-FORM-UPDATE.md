# Settings Form Update - Setup Guide

## Overview
The Settings tab user creation form has been updated to match the registration form with comprehensive fields. Admin-created users are now stored directly in the `users` table (no approval needed).

## Changes Made

### 1. New API Endpoint
- **Path**: `/api/users/create-direct`
- **Method**: POST
- **Purpose**: Create users directly in the `users` table bypassing `pending_users`
- **Fields**: display_name, email, personal_email, password, team, roles (array)

### 2. Updated Settings Form
**New Fields Added:**
- ✅ Full Name (display_name)
- ✅ Login Email (@lnc.com validation)
- ✅ Personal Email (for notifications)
- ✅ Team/Department (dropdown)
- ✅ Password
- ✅ Confirm Password
- ✅ Roles (multi-select checkboxes)

**Form Features:**
- Comprehensive validation
- Password confirmation check
- @lnc.com email domain requirement
- Multiple role assignment
- Clear form after successful creation
- Auto-refresh user list

### 3. Database Schema Update Required

**IMPORTANT**: Run this SQL migration before using the new form!

```sql
-- Run this in Supabase SQL Editor
-- File: schemas/database-add-users-columns.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS team TEXT;

CREATE INDEX IF NOT EXISTS idx_users_personal_email ON users(personal_email);
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team);

COMMENT ON COLUMN users.personal_email IS 'User personal email for receiving notifications (not their work @lnc.com email)';
COMMENT ON COLUMN users.team IS 'Department or team the user belongs to (Development, Design, Marketing, etc.)';
```

## Setup Instructions

### Step 1: Database Migration
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `schemas/database-add-users-columns.sql`
4. Run the migration
5. Verify columns were added:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users';
   ```

### Step 2: Test the New Form
1. Start the development server: `npm run dev`
2. Login as Super Admin
3. Go to Settings → User Management
4. Fill in the comprehensive user creation form:
   - Full Name: "John Doe"
   - Login Email: "john@lnc.com"
   - Personal Email: "john.doe@gmail.com"
   - Team: "Development"
   - Password: "test123456"
   - Confirm Password: "test123456"
   - Roles: Check "Dev Team Admin" and "Dev Member"
5. Click "Create User"
6. Verify:
   - Success toast appears
   - Form clears
   - User appears in the user list immediately (no approval needed)
   - User is active and can login

### Step 3: Run Test Script (Optional)
```bash
node testing/test-direct-user-creation.js
```

This will:
- Create a test user via the API
- Verify user exists in database
- Check all fields are stored correctly
- Confirm roles are assigned
- Validate user is active immediately

## Field Descriptions

### Required Fields (*)
- **Full Name**: User's display name (shown in UI)
- **Login Email**: Must be @lnc.com format (used for login)
- **Password**: Minimum 6 characters
- **Confirm Password**: Must match password
- **Roles**: At least one role must be selected

### Optional Fields
- **Personal Email**: Real email for receiving notifications
- **Team**: Department/team selection (Development, Design, Marketing, etc.)

## Available Roles
- Super Admin (full control)
- Admistater (view-only oversight)
- Dev Team Admin
- Social Media Team Admin
- PR & Outreach Team Admin
- Design Team Admin
- Dev Member
- Social Media Member
- PR & Outreach Member
- Design Member

## Behavior Differences: Settings vs Registration

| Feature | Settings Form | Registration Form |
|---------|---------------|-------------------|
| **Target Table** | `users` (direct) | `pending_users` (requires approval) |
| **User Status** | Active immediately | Pending until approved |
| **Who Can Create** | Super Admin only | Anyone (public) |
| **Approval Needed** | ❌ No | ✅ Yes |
| **Email Sent** | ❌ No welcome email | ✅ Pending approval notification |
| **Role Assignment** | Admin selects multiple roles | Assigned during approval |

## Validation Rules

1. **Display Name**: Required, any text
2. **Email**: Required, must end with `@lnc.com`
3. **Personal Email**: Optional, valid email format
4. **Password**: Required, minimum 6 characters
5. **Confirm Password**: Required, must match password
6. **Team**: Optional dropdown selection
7. **Roles**: Required, at least one role selected

## Troubleshooting

### Error: "Could not find the 'team' column"
**Solution**: Run the database migration (Step 1)

### Error: "Email must be from @lnc.com domain"
**Solution**: Use format like `user@lnc.com` for login email

### Error: "Passwords do not match"
**Solution**: Ensure both password fields have identical values

### Error: "Please select at least one role"
**Solution**: Check at least one role checkbox before submitting

## Files Modified

- ✅ `app/api/users/create-direct/route.ts` (new endpoint)
- ✅ `components/dashboard/settings.tsx` (updated form)
- ✅ `schemas/database-add-users-columns.sql` (migration)
- ✅ `testing/test-direct-user-creation.js` (test script)

## Next Steps

1. Run database migration
2. Test user creation through Settings form
3. Verify users can login immediately
4. Check email notifications use personal_email when set
5. Confirm role permissions work correctly

---

**Status**: ✅ Implementation complete, pending database migration
**Last Updated**: [Current Date]
