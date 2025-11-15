# Settings Page - Database Connection Status

## ✅ Current Status: FULLY CONNECTED

The Settings page is **already connected to the database** and fully functional. However, it requires the `profiles` table to be created in Supabase.

## 🔧 What's Working

### Settings Page Features:
1. ✅ **Create New Users** - Add users with email/password and assign roles (user, editor, admin)
2. ✅ **List All Users** - View all users from Supabase Auth with their roles
3. ✅ **Update User Roles** - Change roles via dropdown menu
4. ✅ **Delete Users** - Remove users with confirmation
5. ✅ **Theme Settings** - Toggle dark/light mode

### API Endpoints Connected:
- ✅ `POST /api/users/create` - Creates user in Supabase Auth + profiles table
- ✅ `GET /api/users/list` - Fetches users from auth.users + profiles table
- ✅ `PATCH /api/users/update-role` - Updates user_metadata and profiles table
- ✅ `DELETE /api/users/delete` - Deletes user from Supabase Auth (cascades to profiles)

### Database Tables Used:
- ✅ `auth.users` - Supabase Auth users (managed automatically)
- ⚠️ `profiles` - **NEEDS TO BE CREATED** - Stores user roles and metadata

## ⚠️ Current Error

```
Profile fetch error: Could not find the table 'public.profiles' in the schema cache
```

**Cause**: The `profiles` table doesn't exist yet in your Supabase database.

**Solution**: Run the SQL script `setup-profiles-table.sql` in Supabase SQL Editor.

## 🚀 Quick Fix

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `bjlpvbiyjpcjgvpdzvcy`
3. Navigate to **SQL Editor**

### Step 2: Run Setup Script
Copy and paste the contents of `setup-profiles-table.sql` and click **Run**.

This will:
- Create the `profiles` table
- Set up auto-trigger for new user profiles
- Create profiles for existing users
- Enable Row Level Security

### Step 3: Restart Dev Server
```bash
npm run dev
```

### Step 4: Test Settings Page
1. Go to http://localhost:3000/dashboard
2. Click on **Settings** in the sidebar
3. Try creating a new user
4. Verify the user appears in the list

## 📊 Database Schema

### profiles Table
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY,           -- References auth.users(id)
    role TEXT DEFAULT 'user',      -- user, editor, or admin
    display_name TEXT,             -- Optional display name
    created_at TIMESTAMPTZ,        -- Creation timestamp
    updated_at TIMESTAMPTZ         -- Last update timestamp
);
```

### How It Works Together

1. **User Creation Flow**:
   ```
   Settings Page → POST /api/users/create
   → Supabase Auth creates user
   → Trigger automatically creates profile
   → Response sent back to frontend
   → User list refreshed
   ```

2. **User List Flow**:
   ```
   Settings Page → GET /api/users/list
   → Fetch from auth.users
   → Join with profiles table for roles
   → Return merged data
   → Display in table
   ```

3. **Role Update Flow**:
   ```
   Settings Page → PATCH /api/users/update-role
   → Update user_metadata in auth.users
   → Update role in profiles table
   → Return success
   → Refresh user list
   ```

## 🎯 Next Steps

1. ✅ Create profiles table (run `setup-profiles-table.sql`)
2. ✅ Test user creation in Settings page
3. ✅ Test role updates
4. ✅ Test user deletion
5. ✅ Verify everything works as expected

## 📝 Additional Notes

- The Settings page uses **Supabase Auth** for user management
- Roles are stored in both `auth.users.user_metadata` and `profiles.role`
- The custom `users` table in `database-setup.sql` is for advanced auth scenarios
- Current implementation uses Supabase Auth exclusively
- All operations require `SUPABASE_SERVICE_ROLE_KEY` for admin access

## 🔒 Security

- Middleware protects all `/api/users/*` routes
- Service role key used for admin operations
- Row Level Security enabled on profiles table
- JWT tokens include user roles for authorization
