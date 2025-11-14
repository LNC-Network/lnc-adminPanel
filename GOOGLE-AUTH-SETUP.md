# Google OAuth Setup Guide

This guide will help you enable Google sign-in for your admin panel.

## Step 1: Configure Google OAuth in Supabase

1. **Go to Supabase Authentication Settings:**

   - Open: https://supabase.com/dashboard/project/gcmwigmgrosmqsvdvtik/auth/providers

2. **Enable Google Provider:**

   - Find "Google" in the list of providers
   - Toggle it **ON**

3. **Configure Google OAuth:**
   - You'll need to create a Google OAuth application first
   - Go to: https://console.cloud.google.com/apis/credentials

## Step 2: Create Google OAuth Application

1. **Go to Google Cloud Console:**

   - Visit: https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Google+ API:**

   - Go to: APIs & Services → Library
   - Search for "Google+ API"
   - Click "Enable"

3. **Create OAuth Credentials:**

   - Go to: APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Name it: "LNC Admin Panel"

4. **Configure OAuth Consent Screen (if prompted):**

   - User Type: External (or Internal if workspace)
   - App name: "LNC Admin Panel"
   - User support email: your email
   - Developer contact: your email
   - Add scopes: email, profile, openid
   - Save

5. **Add Authorized Redirect URIs:**
   In the OAuth client configuration, add these URIs:

   ```
   https://gcmwigmgrosmqsvdvtik.supabase.co/auth/v1/callback
   http://localhost:3000/api/auth/callback
   http://localhost:3001/api/auth/callback
   ```

6. **Get Your Credentials:**
   - Copy the **Client ID**
   - Copy the **Client Secret**

## Step 3: Add Google OAuth to Supabase

1. **Go back to Supabase:**

   - Open: https://supabase.com/dashboard/project/gcmwigmgrosmqsvdvtik/auth/providers

2. **Configure Google Provider:**
   - Paste your **Client ID**
   - Paste your **Client Secret**
   - Click **"Save"**

## Step 4: Update Your Environment (Optional)

If you want to store Google OAuth credentials locally, add to `.env.local`:

```env
# Google OAuth (Optional - already configured in Supabase)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Step 5: Test Google Login

1. **Restart your dev server:**

   ```bash
   pnpm dev
   ```

2. **Go to login page:**

   - http://localhost:3001/login

3. **Click "Sign in with Google"**

4. **Authorize the app** with your Google account

5. **You'll be redirected to the dashboard!**

## How It Works

### Login Flow:

1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent screen
3. User authorizes the app
4. Google redirects back to: `/api/auth/callback?code=...`
5. Backend exchanges code for session tokens
6. If user doesn't have admin/editor role, automatically set to "editor"
7. Cookies are set with session tokens
8. User redirected to `/dashboard`

### User Roles:

- **First-time Google login:** User gets "editor" role by default
- **To make someone admin:** Go to Settings and change their role
- **Or manually in Supabase:** Edit user metadata to set role

## Security Notes

1. **Client Secret is sensitive** - never commit to git
2. **Use HTTPS in production** - required by Google OAuth
3. **Redirect URIs must match exactly** - including http/https and port
4. **Only allow admin/editor roles** - regular users can't access admin panel

## Troubleshooting

### Error: "redirect_uri_mismatch"

- **Cause:** Redirect URI not configured in Google Console
- **Fix:** Add the exact redirect URI to Google OAuth settings

### Error: "Access denied"

- **Cause:** User doesn't have admin/editor role
- **Fix:** User will automatically get "editor" role on first Google login

### Error: "auth_failed"

- **Cause:** Failed to exchange code for session
- **Fix:** Check that service_role_key is correct in `.env.local`

### Google button not working

- **Cause:** Supabase URL or anon key incorrect
- **Fix:** Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Managing Google OAuth Users

### View All Users (including Google):

- Go to: https://supabase.com/dashboard/project/gcmwigmgrosmqsvdvtik/auth/users
- Google users will have their Google email

### Change User Role:

1. Go to Dashboard → Settings
2. Find the user in the list
3. Change role to "admin" or "editor" using dropdown

### Disable Google Login for a User:

- In Supabase Dashboard → Auth → Users
- Click on user → "Delete user"

## Additional Providers

You can also enable other OAuth providers:

- GitHub
- GitLab
- Bitbucket
- Azure
- Facebook
- Twitter
- Discord
- And more...

Just enable them in: https://supabase.com/dashboard/project/gcmwigmgrosmqsvdvtik/auth/providers

## Production Deployment

When deploying to production:

1. **Update Redirect URIs in Google Console:**

   ```
   https://your-domain.com/api/auth/callback
   https://gcmwigmgrosmqsvdvtik.supabase.co/auth/v1/callback
   ```

2. **Update environment variables:**

   - Set `NEXT_PUBLIC_SITE_URL` to your production URL
   - Ensure cookies use `secure: true`

3. **Test thoroughly** before going live!

---

Need help? The Google OAuth integration is now ready to use! 🚀
