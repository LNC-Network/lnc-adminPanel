# Database Setup Instructions

## Overview

The admin panel uses Supabase for authentication and database management. The settings page is fully connected to the database and allows you to:

- Create new users with roles (user, editor, admin)
- View all users in the system
- Update user roles
- Delete users

## Setup Steps

### 1. Supabase Project

Make sure you have a Supabase project set up with the correct environment variables in `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

### 2. Run Database Migrations

Execute the SQL script in `database-setup.sql` in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-setup.sql`
4. Click "Run" to execute the script

This will create:

- **profiles** table - Stores user roles and profile data
- **users** table - Custom user table (if needed for custom auth)
- **roles** table - Predefined roles (admin, editor, user)
- **permissions** table - Granular permissions
- **user_roles** table - Many-to-many relationship between users and roles
- **role_permissions** table - Many-to-many relationship between roles and permissions
- **refresh_tokens** table - For JWT refresh token management
- **Trigger** - Automatically creates a profile when a new user signs up

### 3. Enable Row Level Security (RLS)

For security, enable RLS on the profiles table:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow service role to read all profiles
CREATE POLICY "Service role can read all profiles" ON profiles
    FOR SELECT
    USING (true);

-- Allow service role to update all profiles
CREATE POLICY "Service role can update all profiles" ON profiles
    FOR UPDATE
    USING (true);
```

### 4. Test the Setup

1. Start the development server: `npm run dev`
2. Login to the admin panel
3. Navigate to Settings page
4. Try creating a new user with different roles
5. Verify the user appears in the user list
6. Test role updates and user deletion

## Features Connected to Database

### User Management (Settings Page)

- ✅ Create new users with email/password
- ✅ Assign roles: admin, editor, or user
- ✅ View all users with their roles and creation dates
- ✅ Update user roles in real-time
- ✅ Delete users (with confirmation)
- ✅ Auto-refresh user list after operations

### API Endpoints

All settings operations use these API routes:

- `POST /api/users/create` - Create a new user
- `GET /api/users/list` - List all users
- `PATCH /api/users/update-role` - Update user role
- `DELETE /api/users/delete` - Delete a user

### Authentication Flow

1. User logs in via `/api/auth/login`
2. JWT token is generated with user roles and permissions
3. Token is stored in cookies for middleware validation
4. User data (including roles) is stored in localStorage
5. Settings page fetches users from Supabase Auth + profiles table

## Troubleshooting

### Users not showing in Settings page

- Check that the trigger `on_auth_user_created` is created
- Manually insert profile for existing users:
  ```sql
  INSERT INTO profiles (id, role)
  SELECT id, 'user' FROM auth.users
  ON CONFLICT (id) DO NOTHING;
  ```

### Cannot create users

- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check Supabase Auth settings allow email signups

### Role updates not persisting

- Ensure profiles table exists
- Check RLS policies allow service role to update

### Permission denied errors

- Verify you're using the service role key for admin operations
- Check that middleware is properly configured

## Database Schema

### profiles

- `id` (UUID, PK) - References auth.users
- `role` (TEXT) - user, editor, or admin
- `display_name` (TEXT) - Optional display name
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### roles

- `id` (UUID, PK)
- `name` (TEXT, UNIQUE)
- `description` (TEXT)

### permissions

- `id` (UUID, PK)
- `code` (TEXT, UNIQUE)
- `description` (TEXT)
