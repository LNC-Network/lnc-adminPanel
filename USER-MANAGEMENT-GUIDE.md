# User Management Guide

This guide explains how to manage users in your admin panel using Supabase Auth.

## Prerequisites

Before you can manage users, you need to:

1. **Get the correct Service Role Key**:

   - Go to your Supabase Dashboard: https://supabase.com/dashboard/project/gcmwigmgrosmqsvdvtik/settings/api
   - Under "Project API keys", find the **service_role** key (not the anon key!)
   - Copy the key (it starts with `eyJhbGci...` and has `"role":"service_role"` when decoded)
   - Update `.env.local` line 8:
     ```
     SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
     ```
   - **⚠️ IMPORTANT**: Never commit this key to git! It has full admin access.

2. **Create the first admin user**:
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add user" → "Create new user"
   - Enter email and password
   - After creating, click on the user
   - Scroll to "User Metadata" → Click "Edit"
   - Add this JSON:
     ```json
     {
       "role": "admin"
     }
     ```
   - Click "Save"

## Using the Settings Panel

Once you have the service role key set up and an admin user created, you can manage users directly from the dashboard:

### Creating Users

1. Go to **Dashboard → Settings**
2. Fill in the "Create New User" form:
   - **Email**: User's email address
   - **Password**: Must be at least 6 characters
   - **Role**: Choose from:
     - **User**: No admin panel access (regular app users)
     - **Editor**: Limited admin access (can edit content)
     - **Admin**: Full access to all features
3. Click "Create User"

### Managing Existing Users

In the "User Management" table, you can:

- **View all users**: See email, role, created date, and last sign-in
- **Change roles**: Use the dropdown to change a user's role
  - Changes take effect immediately
  - User needs to log out and log back in to see updated permissions
- **Delete users**: Click the trash icon to remove a user
  - This permanently deletes the user from Supabase Auth
  - Their profile data is also removed automatically

## API Endpoints

The Settings panel uses these API endpoints:

### POST `/api/users/create`

Creates a new user with Supabase Auth.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "admin"
}
```

**Response**:

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

### GET `/api/users/list`

Lists all users from Supabase Auth with their roles.

**Response**:

```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "admin@example.com",
      "created_at": "2024-01-01T00:00:00Z",
      "last_sign_in_at": "2024-01-15T10:30:00Z",
      "user_metadata": {
        "role": "admin"
      }
    }
  ]
}
```

### PATCH `/api/users/update-role`

Updates a user's role in both Supabase Auth and the profiles table.

**Request Body**:

```json
{
  "userId": "uuid",
  "role": "editor"
}
```

**Response**:

```json
{
  "success": true,
  "user": { ... }
}
```

### DELETE `/api/users/delete`

Deletes a user from Supabase Auth (cascades to profiles table).

**Request Body**:

```json
{
  "userId": "uuid"
}
```

**Response**:

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Role-Based Access Control

The admin panel uses three roles:

### User

- Cannot access the admin panel
- Use this for regular app users who shouldn't have admin access

### Editor

- Can access the admin panel
- Has limited permissions (configure in your app logic)
- Good for content managers, moderators, etc.

### Admin

- Full access to all admin panel features
- Can manage other users
- Can change settings

## Security Notes

1. **Service Role Key Security**:

   - The service role key bypasses Row Level Security
   - Never expose it in client-side code
   - Only use it in API routes (server-side)
   - Keep it in `.env.local` and never commit to git

2. **Password Requirements**:

   - Minimum 6 characters (enforced by Supabase)
   - Consider requiring stronger passwords for admin users

3. **Email Confirmation**:

   - Users created via the Settings panel are auto-confirmed
   - They can log in immediately without email verification

4. **User Deletion**:
   - Deleting a user is permanent
   - Consider adding a "deactivate" feature instead for production

## Troubleshooting

### 403 Forbidden Error

- **Cause**: Wrong service role key or using anon key instead
- **Solution**: Get the correct service_role key from Supabase Dashboard → Settings → API

### Users not showing up

- **Cause**: Database trigger not created or failed
- **Solution**: Run the SQL from `database-setup-supabase-auth.sql` in Supabase SQL Editor

### Cannot log in after creating user

- **Cause**: User role not set or incorrect
- **Solution**: Check user_metadata in Supabase Dashboard → Authentication → Users

### Role changes not taking effect

- **Cause**: User needs to refresh their session
- **Solution**: User must log out and log back in

## Next Steps

- Set up email templates in Supabase for password reset
- Configure OAuth providers (Google, GitHub, etc.)
- Add user profile pictures and additional metadata
- Implement user activity logging
- Add user search and filtering in Settings panel
