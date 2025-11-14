# Login Troubleshooting Guide

## Issues Fixed

The login page has been fixed with the following changes:

### 1. **Improved Error Handling in Login Component**

- Added proper validation before submitting
- Fixed API response parsing (the token is returned as a plain string)
- Added better error messages for users
- Added success toast notification
- Improved error logging for debugging

### 2. **Fixed Token Verification in Server Components**

- Updated login page to properly handle verify endpoint response
- Added try-catch for better error handling
- Fixed response parsing to check `data.success` property

### 3. **Fixed Home Page Token Verification**

- Updated to properly parse the verify response object
- Added error handling to redirect to login on failure

## How to Test the Login

### Prerequisites

Make sure you have:

1. **Database Setup**: Run the `database-setup.sql` in your Supabase SQL editor
2. **Environment Variables**: Configure `.env.local` with your Supabase credentials
3. **Default User**: Ensure the default user exists in your database

### Testing Steps

1. **Start the development server:**

   ```bash
   pnpm dev
   ```

2. **Navigate to the login page:**
   Open http://localhost:3000 (it will redirect to /login)

3. **Test with default credentials:**

   - Email: `admin@example.com`
   - Password: `admin123`

4. **Expected behavior:**
   - Success: You'll see a "Login successful!" toast and be redirected to /dashboard
   - Failure: You'll see an error message indicating the issue

## Common Issues and Solutions

### Issue 1: "Invalid credentials" even with correct password

**Possible Causes:**

- Database not set up
- Supabase credentials incorrect
- User doesn't exist in database

**Solution:**

```sql
-- Check if user exists in Supabase SQL Editor:
SELECT * FROM adminpaneluser WHERE user_email = 'admin@example.com';

-- If no results, insert the default user:
INSERT INTO adminpaneluser (user_email, user_password)
VALUES ('admin@example.com', 'admin123')
ON CONFLICT (user_email) DO NOTHING;
```

### Issue 2: "Login failed. Please try again."

**Possible Causes:**

- Supabase API credentials are wrong
- Network issue
- CORS error

**Solution:**

1. Check browser console (F12) for detailed error
2. Verify `.env.local` has correct SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
3. Restart the dev server after changing .env.local:
   ```bash
   # Ctrl+C to stop, then:
   pnpm dev
   ```

### Issue 3: Environment variables not working

**Solution:**

```bash
# Make sure the file is named exactly .env.local (not .env.local.txt)
# Restart the dev server after any changes to .env.local
# Check the file is in the root directory (same level as package.json)
```

### Issue 4: JWT_SECRET error

**Solution:**
Make sure JWT_SECRET is set in `.env.local`:

```bash
# Generate a secure secret:
openssl rand -base64 32

# Or use any random string:
JWT_SECRET=my-super-secret-key-change-this-in-production
```

### Issue 5: NEXT_PUBLIC_SITE_URL issues

**Solution:**
Ensure it's set correctly in `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Debug Mode

To see detailed error messages in the console:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to login
4. Check for error messages

The login component now logs errors with `console.error("Login error:", err)` for easier debugging.

## Verify Your Supabase Setup

1. **Go to Supabase Dashboard** → Your Project
2. **Table Editor** → Check `adminpaneluser` table exists
3. **SQL Editor** → Run:
   ```sql
   SELECT * FROM adminpaneluser;
   ```
4. You should see at least one user (admin@example.com)

## Test API Endpoints Directly

### Test Login Endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Expected response: A JWT token string

### Test Verify Endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE"}'
```

Expected response: `{"success":true}`

## Changes Made to Fix Login

### `components/login-page.tsx`

- ✅ Added input validation
- ✅ Fixed API response parsing
- ✅ Added success/error toast messages
- ✅ Improved error handling with try-catch
- ✅ Changed `router.replace` to `router.push` for better navigation

### `app/login/page.tsx`

- ✅ Fixed token verification to properly parse response object
- ✅ Added try-catch for error handling
- ✅ Check `data.success` property instead of treating response as boolean

### `app/page.tsx`

- ✅ Fixed home page token verification
- ✅ Added try-catch for error handling
- ✅ Properly parse verify response object

## What Was Wrong

The main issues were:

1. **Response Parsing**: The code was treating the verify response as a boolean directly, but it actually returns `{ success: true }` as an object.

2. **Error Handling**: When login failed, the code tried to parse error responses without checking if the response was OK first.

3. **Token Storage**: The token was being stored correctly, but the response parsing was incorrect.

## If Still Not Working

1. **Clear browser cookies and cache**
2. **Restart the dev server** (Ctrl+C then `pnpm dev`)
3. **Check Supabase project is active** (not paused)
4. **Verify all environment variables** are set correctly
5. **Check browser console** for detailed error messages
6. **Check terminal** where dev server is running for server-side errors

## Need More Help?

If you're still experiencing issues:

1. Check the browser console (F12) for errors
2. Check the terminal where `pnpm dev` is running
3. Verify your Supabase project is active and accessible
4. Make sure you've run the database-setup.sql script
5. Try creating a new admin user in Supabase Table Editor

---

The login should now work correctly! If you encounter any issues, check the console logs for detailed error messages.
