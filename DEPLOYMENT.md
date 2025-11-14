# Deployment Guide

This guide covers deploying the LNC Admin Panel to various hosting platforms.

## 📋 Pre-Deployment Checklist

Before deploying to production:

- [ ] Set strong JWT_SECRET (use `openssl rand -base64 32`)
- [ ] Change default admin credentials
- [ ] Configure all environment variables
- [ ] Test all features in development
- [ ] Enable HTTPS (automatic on most platforms)
- [ ] Set up database backups
- [ ] Configure proper CORS policies
- [ ] Review and restrict API access
- [ ] Enable Row Level Security in Supabase
- [ ] Test responsive design
- [ ] Check for console errors

## 🚀 Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

### Step 1: Prepare Your Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/lnc-adminPanel.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Build Command**: `pnpm build` or `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install` or `npm install`

### Step 3: Add Environment Variables

In Vercel project settings, add:

```env
JWT_SECRET=your-production-jwt-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### Step 4: Deploy

Click "Deploy" and wait for the build to complete.

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_SITE_URL` to your custom domain

## 🌐 Deploy to Netlify

### Step 1: Build Configuration

Create `netlify.toml` in your project root:

```toml
[build]
  command = "pnpm build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Step 2: Deploy

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings (auto-detected from netlify.toml)
5. Add environment variables in Netlify dashboard
6. Deploy!

## 🐳 Deploy with Docker

### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    restart: unless-stopped
```

### Deploy

```bash
docker-compose up -d
```

## ☁️ Deploy to AWS (EC2)

### Step 1: Launch EC2 Instance

1. Choose Ubuntu 22.04 LTS
2. Select t2.micro (free tier) or larger
3. Configure security group:
   - SSH (port 22)
   - HTTP (port 80)
   - HTTPS (port 443)
   - Custom TCP (port 3000)

### Step 2: Connect and Setup

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install git
sudo apt install git -y

# Clone repository
git clone https://github.com/YOUR_USERNAME/lnc-adminPanel.git
cd lnc-adminPanel

# Install dependencies
pnpm install

# Create .env.local file
nano .env.local
# (paste your environment variables)

# Build the application
pnpm build

# Install PM2 for process management
sudo npm install -g pm2

# Start the application
pm2 start npm --name "admin-panel" -- start

# Set PM2 to start on boot
pm2 startup
pm2 save
```

### Step 3: Configure Nginx (Optional)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/admin-panel
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/admin-panel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is setup automatically
```

## 🚂 Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Next.js
5. Add environment variables
6. Deploy!

Railway automatically provides:

- Custom domain
- HTTPS
- Automatic deployments
- Environment management

## 🌊 Deploy to DigitalOcean App Platform

1. Go to [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)
2. Click "Create App"
3. Connect your GitHub repository
4. Configure:
   - **Environment**: Node.js
   - **Build Command**: `pnpm build`
   - **Run Command**: `pnpm start`
5. Add environment variables
6. Deploy!

## 📊 Post-Deployment

### Monitoring

Set up monitoring for:

- Application errors
- API response times
- Database performance
- User activity

**Recommended Tools:**

- Vercel Analytics (built-in on Vercel)
- Sentry for error tracking
- LogRocket for user sessions
- Supabase Dashboard for database

### Database Backups

Enable automatic backups in Supabase:

1. Go to Supabase Dashboard
2. Navigate to Database → Backups
3. Enable Point-in-Time Recovery (PITR)
4. Configure backup retention period

### Security

1. **Enable Supabase Row Level Security (RLS)**

   ```sql
   -- Enable RLS on tables
   ALTER TABLE adminpaneluser ENABLE ROW LEVEL SECURITY;

   -- Create policies as needed
   CREATE POLICY "Admin users only" ON adminpaneluser
   FOR ALL USING (auth.role() = 'authenticated');
   ```

2. **Configure Supabase Auth Policies**

   - Set up email confirmations
   - Configure password requirements
   - Enable MFA if needed

3. **Review API Routes**
   - Add rate limiting
   - Validate all inputs
   - Sanitize user data

### Performance Optimization

1. **Enable caching**

   ```typescript
   // In API routes
   export const revalidate = 3600; // Cache for 1 hour
   ```

2. **Optimize images**

   - Use Next.js Image component
   - Configure image optimization in next.config.js

3. **Enable compression**
   - Automatic on Vercel/Netlify
   - Configure Nginx gzip for custom servers

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test # if you have tests
```

## 🆘 Troubleshooting

### Build Fails

**Issue**: "Module not found" error
**Solution**:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Environment Variables Not Working

**Issue**: Variables not accessible in production
**Solution**:

- Client-side variables must start with `NEXT_PUBLIC_`
- Redeploy after adding new variables
- Check variable names are exactly correct

### Database Connection Issues

**Issue**: "Unable to connect to database"
**Solution**:

- Verify Supabase URL and keys
- Check if Supabase project is active
- Ensure IP allowlist includes deployment platform

### 500 Internal Server Error

**Issue**: Application crashes in production
**Solution**:

- Check server logs
- Verify all environment variables are set
- Test API routes individually
- Check Supabase connection

## 📧 Support

Need help with deployment?

- Email: jit.nathdeb@gmail.com
- GitHub Issues: [Create an issue](https://github.com/LNC-Network/lnc-adminPanel/issues)

---

Good luck with your deployment! 🚀
