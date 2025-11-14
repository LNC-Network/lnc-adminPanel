# Supabase Auth Setup Guide

This guide will help you migrate from the custom JWT authentication to Supabase Auth with role-based access control.

## 🎯 Benefits of Supabase Auth

- ✅ **Built-in password hashing** (bcrypt)
- ✅ **Email verification** out of the box
- ✅ **Password reset** functionality
- ✅ **OAuth providers** (Google, GitHub, etc.)
- ✅ **Role-based access control**
- ✅ **Session management**
- ✅ **Token refresh** handled automatically
- ✅ **Security best practices** built-in

## 📋 Migration Steps

### Step 1: Configure Supabase Auth

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Configure the following:

   **Site URL**: `http://localhost:3000` (dev) or your production URL

   **Redirect URLs**: Add:

   - `http://localhost:3000/dashboard`
   - `https://your-domain.com/dashboard` (production)

   **Email Auth**: Enable (it's enabled by default)

   **Confirm email**: Optional (disable for testing, enable for production)

### Step 2: Run Database Setup

1. Open Supabase SQL Editor
2. Run the `database-setup-supabase-auth.sql` file
3. This will:
   - Create profiles table
   - Set up RLS policies
   - Create helper functions
   - Sync auth.users with profiles

### Step 3: Create Admin User

#### Option A: Via Supabase Dashboard (Easiest)

1. Go to **Authentication** → **Users**
2. Click **"Add user"**
3. Enter:
   - **Email**: `admin@example.com`
   - **Password**: Choose a secure password
   - **Auto Confirm User**: ✅ Check this
4. Click **"Create user"**
5. After user is created, click on the user to edit
6. Under **User Metadata**, click "Add field" and add:
   ```json
   {
     "role": "admin"
   }
   ```
7. Save changes

#### Option B: Via Supabase API (For Automation)

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-secure-password",
    "email_confirm": true,
    "user_metadata": {
      "role": "admin"
    }
  }'
```

Replace:

- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_SERVICE_ROLE_KEY` with your service role key from Settings → API

### Step 4: Update Environment Variables

Your `.env.local` should have these (already configured):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

You can remove:

```env
JWT_SECRET=...  # No longer needed
```

### Step 5: Test the Login

1. Start the dev server:

   ```bash
   pnpm dev
   ```

2. Go to http://localhost:3000

3. Login with the admin credentials you created

4. You should be redirected to the dashboard!

## 🔐 Role-Based Access Control

### Available Roles

- **admin**: Full access to all features
- **editor**: Can manage content, forms, and database (configurable)
- **user**: Regular user (blocked from admin panel by default)

### How Roles Work

1. Roles are stored in `user_metadata.role` in Supabase Auth
2. During login, the API checks the user's role
3. Only users with `admin` or `editor` roles can access the admin panel
4. The role is also stored in the `profiles` table for easy querying

### Changing User Roles

#### Via Supabase Dashboard:

1. Go to **Authentication** → **Users**
2. Click on the user you want to modify
3. Under **User Metadata**, update the `role` field:
   ```json
   {
     "role": "admin"
   }
   ```
   or
   ```json
   {
     "role": "editor"
   }
   ```

#### Via SQL:

```sql
-- Update profile role
UPDATE profiles
SET role = 'admin'
WHERE email = 'user@example.com';
```

## 🔄 What Changed

### Code Changes:

1. **`app/api/auth/login/route.ts`**

   - Now uses `supabase.auth.signInWithPassword()`
   - Checks user role before allowing login
   - Returns access_token and refresh_token

2. **`app/api/auth/verify/route.ts`**

   - Uses `supabase.auth.getUser()` to verify tokens
   - Checks user role for authorization

3. **`components/login-page.tsx`**

   - Stores `access_token` and `refresh_token` in cookies
   - Stores user info in localStorage

4. **`app/page.tsx` & `app/login/page.tsx`**

   - Updated to use `access_token` instead of custom JWT

5. **`components/dashboard/dashboard.tsx`**
   - Updated logout to clear all auth cookies

### Database Changes:

1. **New `profiles` table** - Syncs with auth.users
2. **RLS policies** - Secure data access
3. **Helper functions** - `is_admin()`, `is_admin_or_editor()`

## 🚀 Additional Features You Can Add

### 1. Password Reset

Add a password reset page using Supabase Auth:

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: "http://localhost:3000/reset-password",
});
```

### 2. OAuth Providers

Enable Google/GitHub login in Supabase Dashboard → Authentication → Providers

### 3. Email Verification

Enable in Supabase Dashboard → Authentication → Settings → Email Templates

### 4. Multi-Factor Authentication (MFA)

Supabase supports MFA - see their docs for implementation

### 5. Session Management

Supabase handles token refresh automatically. To manually refresh:

```typescript
const { data, error } = await supabase.auth.refreshSession();
```

## 🧪 Testing

### Test Admin Login:

- Email: Your created admin email
- Password: Your admin password
- Should redirect to dashboard with "Welcome back, admin!" message

### Test Regular User (should fail):

1. Create a user without admin role in Supabase Dashboard
2. Try to login
3. Should see "Access denied. Admin privileges required."

### Test Token Verification:

- Login and close browser
- Open browser again and go to homepage
- Should automatically redirect to dashboard if token is valid

## 🔒 Security Best Practices

1. **Always use HTTPS in production**

   ```typescript
   secure: process.env.NODE_ENV === "production";
   ```

2. **Enable email confirmation** in production

3. **Set strong password requirements** in Supabase Auth settings

4. **Use RLS policies** to secure database access

5. **Regularly rotate service role keys**

6. **Enable MFA** for admin accounts

7. **Set up password policies**:
   - Go to Auth → Settings → Password
   - Set minimum password length
   - Require special characters

## 📊 Managing Users

### View All Users:

```sql
SELECT
  au.email,
  au.created_at,
  au.last_sign_in_at,
  p.role,
  p.full_name
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
```

### Create Editor User (via SQL after manual auth creation):

```sql
UPDATE profiles
SET role = 'editor'
WHERE email = 'editor@example.com';
```

### Disable User:

In Supabase Dashboard → Authentication → Users → Click user → "Delete user"

## 🆘 Troubleshooting

### Issue: "Access denied. Admin privileges required."

**Solution**: Make sure the user has `role: "admin"` in their user_metadata:

1. Go to Authentication → Users
2. Click on the user
3. Check User Metadata has `{"role": "admin"}`

### Issue: "Invalid or expired token"

**Solution**:

- Clear browser cookies and localStorage
- Login again
- Check that NEXT_PUBLIC_SUPABASE_URL is correct

### Issue: Login works but dashboard shows blank

**Solution**:

- Check browser console for errors
- Verify the access_token cookie is being set
- Check that NEXT_PUBLIC_SITE_URL matches your actual URL

### Issue: User created but can't login

**Solution**:

- Make sure "Auto Confirm User" was checked when creating the user
- Or disable email confirmation in Auth → Settings

## 🎉 You're All Set!

Your admin panel now uses Supabase Auth with:

- ✅ Secure password hashing
- ✅ Role-based access control
- ✅ Session management
- ✅ Token refresh
- ✅ Production-ready authentication

For more advanced features, check the [Supabase Auth docs](https://supabase.com/docs/guides/auth).
