# Quick Fix for Integration Issues

## Problem

Your admin panel has integration issues because:

1. ❌ Service Role Key is incorrect (using anon key instead)
2. ❌ No admin user exists in Supabase Auth

## Quick Solution (5 minutes)

### Step 1: Create Admin User in Supabase

1. Open: https://supabase.com/dashboard/project/gcmwigmgrosmqsvdvtik/auth/users
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - Email: `admin@lnc.com`
   - Password: `admin123456`
   - ✅ Check "Auto Confirm User"
4. Click **"Create user"**
5. Click on the newly created user
6. Find **"User Metadata"** section → Click **"Edit"**
7. Replace the content with:
   ```json
   {
     "role": "admin"
   }
   ```
8. Click **"Save"**

### Step 2: Get Service Role Key

1. Open: https://supabase.com/dashboard/project/gcmwigmgrosmqsvdvtik/settings/api
2. Find **"service_role"** key (marked 🔴 Secret)
3. Click **"Reveal"**
4. Copy the ENTIRE key
5. Paste it here in chat, and I'll update your `.env.local` file

### Step 3: Test Login

After updating the service role key:

1. Stop the dev server (Ctrl+C)
2. Start it again: `pnpm dev`
3. Go to http://localhost:3001/login
4. Login with:
   - Email: `admin@lnc.com`
   - Password: `admin123456`

## What's Currently Wrong

Your `.env.local` file has this on line 8:

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...JkxclRZ (this is the ANON key!)
```

It should have a DIFFERENT key that starts with `eyJhbGci` but has `"role":"service_role"` when decoded.

### How to Tell the Difference:

- **Anon Key** (current): Has `"role":"anon"` when decoded
- **Service Role Key** (needed): Has `"role":"service_role"` when decoded

## After You Fix It

✅ Login will work
✅ Dashboard will load
✅ Settings panel will be able to create/manage users
✅ All API endpoints will work

Just paste the service role key here and I'll update everything for you! 🚀
