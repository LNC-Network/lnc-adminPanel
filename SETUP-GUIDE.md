# Quick Setup Guide for LNC Admin Panel

This guide will help you get the admin panel up and running in minutes.

## Step 1: Prerequisites

✅ Install Node.js (v18 or higher): https://nodejs.org/
✅ Install pnpm: `npm install -g pnpm`
✅ Create a Supabase account: https://supabase.com/

## Step 2: Supabase Setup

1. **Create a new Supabase project**

   - Go to https://app.supabase.com/
   - Click "New Project"
   - Choose a name, database password, and region
   - Wait for the project to be created (~2 minutes)

2. **Run the database setup**

   - Go to the "SQL Editor" in your Supabase dashboard
   - Create a new query
   - Copy the contents of `database-setup.sql` file
   - Click "Run" to execute the SQL

3. **Get your API credentials**
   - Go to Project Settings → API
   - Copy the following:
     - Project URL
     - `anon` `public` key
     - `service_role` `secret` key

## Step 3: Project Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/LNC-Network/lnc-adminPanel.git
   cd lnc-adminPanel
   pnpm install
   ```

2. **Configure environment variables**

   - Copy `.env.local` to your project root
   - Fill in the values:

   ```env
   JWT_SECRET=your-random-secret-here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   **Generate JWT_SECRET:**

   ```bash
   # On Mac/Linux:
   openssl rand -base64 32

   # On Windows PowerShell:
   -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
   ```

## Step 4: Run the Application

```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

## Step 5: First Login

Use the default credentials:

- **Email**: admin@example.com
- **Password**: admin123

⚠️ **IMPORTANT**: Go to Settings and change these credentials immediately!

## Step 6: Explore Features

### Dashboard Overview

- View statistics and recent activity
- Quick access to all features

### Content Management

- Click "Content" in the sidebar
- Upload images and files
- Switch between grid and list views

### Database Viewer

- Click "Database" in the sidebar
- Browse your tables
- Export data to CSV

### Form Builder

- Click "Forms" in the sidebar
- Create custom forms with drag-and-drop
- Preview your forms in real-time

### Settings

- Click "Settings" in the sidebar
- Add and manage admin users
- Toggle dark/light theme

## Common Issues & Solutions

### Issue: "Cannot connect to database"

**Solution**: Check your Supabase credentials in `.env.local` are correct.

### Issue: "JWT secret error"

**Solution**: Make sure you've set a strong JWT_SECRET in `.env.local`.

### Issue: "Login fails with correct credentials"

**Solution**:

1. Check that you ran the database setup SQL
2. Verify the `adminpaneluser` table exists in Supabase
3. Check that the default user was inserted

### Issue: "Environment variables not loading"

**Solution**:

1. Make sure the file is named exactly `.env.local` (not `.env.local.txt`)
2. Restart the dev server after changing env variables
3. Check that NEXT*PUBLIC* prefix is used for client-side variables

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to https://vercel.com/
3. Import your repository
4. Add environment variables in Vercel project settings
5. Update `NEXT_PUBLIC_SITE_URL` to your production URL
6. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

Just make sure to:

1. Set all environment variables
2. Use Node.js 18 or higher
3. Set build command: `pnpm build` or `npm run build`
4. Set start command: `pnpm start` or `npm start`

## Security Checklist for Production

- [ ] Change default admin credentials
- [ ] Use a strong, random JWT_SECRET
- [ ] Enable Row Level Security (RLS) in Supabase
- [ ] Implement password hashing (replace plain text storage)
- [ ] Set up HTTPS (automatic on Vercel/Netlify)
- [ ] Configure CORS policies
- [ ] Add rate limiting for API routes
- [ ] Enable Supabase database backups
- [ ] Set up monitoring and error tracking
- [ ] Review and restrict Supabase service role key usage

## Need Help?

- 📧 Email: jit.nathdeb@gmail.com
- 🐛 GitHub Issues: [Create an issue](https://github.com/LNC-Network/lnc-adminPanel/issues)
- 📚 Documentation: See README.md

## Next Steps

Once you're familiar with the admin panel:

1. Customize the dashboard statistics to show real data
2. Implement actual file upload to Supabase Storage
3. Add password hashing (bcrypt) for security
4. Create API endpoints for your specific needs
5. Add more admin features as needed

Happy coding! 🚀
