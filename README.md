# LNC Admin Panel

A modern, full-featured admin panel built with Next.js 16, TypeScript, and Tailwind CSS. Features comprehensive role-based access control, user management, ticket system, content management, and database viewer.

## 🚀 Features

- **Role-Based Permission System**: 10-role organizational hierarchy with granular permissions
- **Authentication System**: Secure JWT-based login with Supabase backend and argon2 hashing
- **User Management**: Multi-role assignment, pending registration approval system
- **Ticket System**: GitHub-style issue tracking with assignments and comments (Dev team only)
- **Content Management**: Upload and organize media files with grid/list views
- **Database Viewer**: Browse and manage database tables (Super Admin only)
- **Form Builder**: Create custom forms with drag-and-drop interface
- **Chat System**: Team-based messaging and group management
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode**: Built-in theme switching with next-themes
- **Modern UI**: Beautiful components from shadcn/ui with Radix UI primitives

## 🎭 Role System

### 10 Organizational Roles

**Administration (2 roles):**

- **Super Admin** - Full control over everything (12 permissions)
- **Admistater** - View-only oversight, cannot edit, no database access (3 permissions)

**Team Admins (4 roles):**

- Dev Team Admin
- Social Media Team Admin
- PR & Outreach Team Admin
- Design Team Admin
  _Each has 7 permissions for managing their team_

**Team Members (4 roles):**

- Dev Member
- Social Media Member
- PR & Outreach Member
- Design Member
  _Each has 5 permissions for team work_

See [ROLES.md](ROLES.md) for complete permission matrix and details.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18.x or higher
- Bun (recommended) or pnpm/npm
- A Supabase account and project

## 🛠️ Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/LNC-Network/lnc-adminPanel.git
   cd lnc-adminPanel
   ```

2. **Install dependencies:**

   ```bash
   bun install
   # or
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables:**

   Copy the `.env.local` file and fill in your values:

   ```bash
   cp .env.local.example .env.local
   ```

   Required environment variables:

   - `JWT_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: From Supabase project settings

4. **Set up the database:**

   Run these SQL scripts in your Supabase SQL Editor in order:

   ```bash
   # 1. Create database tables (if not exists)
   database-setup.sql

   # 2. Create role hierarchy
   setup-new-roles.sql

   # 3. Assign permissions to roles
   setup-role-permissions.sql

   # 4. Create ticket system tables (optional)
   setup-tickets-tables.sql

   # 5. Create pending users table (optional)
   setup-pending-users-table.sql
   ```

   See [ADMIN-GUIDE.md](ADMIN-GUIDE.md) for detailed setup instructions.

5. **Assign your first Super Admin:**

   In Supabase SQL Editor:

   ```sql
   -- Find your user ID
   SELECT id, email FROM users WHERE email = 'your-email@lnc.com';

   -- Assign super admin role (replace YOUR_USER_ID)
   INSERT INTO user_roles (user_id, role_id)
   SELECT 'YOUR_USER_ID', id FROM roles WHERE name = 'super admin';
   ```

## 🚀 Running the Application

**Development:**

```bash
bun run dev
# or
pnpm dev
# or
npm run dev
```

**Production:**

```bash
bun run build
bun start
# or
pnpm build && pnpm start
```

Visit `http://localhost:3000` and log in with your credentials.

See `DATABASE_SETUP.md` for detailed instructions.

## 🚀 Usage

### Development Server

Start the development server:

```bash
pnpm dev
# or
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
# or
npm run build
npm start
```

### Default Login

- **Email**: admin@example.com
- **Password**: admin123

**⚠️ Important**: Change these credentials immediately after first login!

## 📁 Project Structure

```
lnc-adminPanel/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints (login, logout, register, verify)
│   │   ├── users/           # User management endpoints (CRUD, roles, pending)
│   │   ├── tickets/         # Ticket system endpoints
│   │   └── chat/            # Chat system endpoints
│   ├── dashboard/           # Dashboard page
│   ├── login/               # Login page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page (redirects)
├── components/              # React components
│   ├── dashboard/           # Dashboard-specific components
│   │   ├── dashboard.tsx    # Main dashboard layout with navigation
│   │   ├── content.tsx      # Content management
│   │   ├── database.tsx     # Database viewer (Super Admin only)
│   │   ├── form-maker.tsx   # Form builder
│   │   ├── settings.tsx     # User management with role assignment
│   │   ├── tickets.tsx      # GitHub-style ticket system
│   │   └── chat.tsx         # Team chat system
│   ├── ui/                  # Reusable UI components (shadcn/ui)
│   ├── login-page.tsx       # Login component
│   └── register-form.tsx    # Registration form
├── lib/                     # Utility functions
│   ├── permissions.ts       # Client-side permission helpers
│   ├── permission-check.ts  # Server-side database permission checks
│   └── utils.ts             # General utilities
├── public/                  # Static assets
└── types/                   # TypeScript type definitions
```

## 🎨 Technologies Used

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Authentication**: JWT with jose
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Hooks
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Theme**: next-themes

## 📱 Features Overview

### Dashboard Overview

- Real-time statistics cards
- Recent activity feed
- Quick action shortcuts
- Responsive sidebar navigation

### Content Management

- Image upload with preview
- Grid and list view modes
- Search and filter functionality
- Download and delete operations

### Database Management

- View multiple tables (Users, Content, Forms)
- Search across all fields
- Export to CSV
- CRUD operations
- Database statistics

### Form Builder

- Drag-and-drop interface
- Multiple field types (text, email, number, textarea, date, checkbox, select)
- Real-time preview mode
- Form validation options
- Save and manage multiple forms

### User Settings

- Add and manage admin users
- View user credentials
- Theme switcher
- Responsive design

## 🔒 Security Notes

1. **Never commit `.env.local`** to version control
2. **Change default credentials** immediately
3. **Use strong JWT secrets** in production
4. **Enable row-level security** in Supabase
5. **Use strong passwords** (minimum 6 characters, stored with argon2 hashing)
6. **Set up CORS policies** appropriately
7. **Use HTTPS** in production
8. **Regularly audit permissions** - Review user roles quarterly

## 📚 Documentation

Comprehensive documentation is available:

- **[ROLES.md](ROLES.md)** - Complete role system documentation with permission matrix
- **[PERMISSIONS.md](PERMISSIONS.md)** - Database permission system guide
- **[PERMISSIONS-QUICK-REF.md](PERMISSIONS-QUICK-REF.md)** - Quick reference for permissions
- **[PERMISSION-ARCHITECTURE.md](PERMISSION-ARCHITECTURE.md)** - Visual architecture diagrams
- **[ADMIN-GUIDE.md](ADMIN-GUIDE.md)** - Step-by-step administrator guide
- **[SETTINGS-UPDATE.md](SETTINGS-UPDATE.md)** - Settings page update details

### SQL Scripts

- `database-setup.sql` - Complete database schema
- `setup-new-roles.sql` - Creates 10 organizational roles
- `setup-role-permissions.sql` - Assigns permissions to roles
- `migrate-roles.sql` - Helper for migrating from old role system
- `setup-tickets-tables.sql` - Ticket system schema
- `setup-pending-users-table.sql` - Registration approval schema

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is a product of LNC Network.

## 🆘 Support

For issues and questions:

- Create an issue on GitHub
- Contact: jit.nathdeb@gmail.com

## 🔄 Updates & Roadmap

Recent updates:

- ✅ Password hashing with argon2
- ✅ Role-based access control (10 roles)
- ✅ Database-driven permission system
- ✅ Multi-role assignment
- ✅ User registration approval workflow
- ✅ GitHub-style ticket system
- ✅ Team-based chat system

Planned features:

- [ ] Team-specific content filtering
- [ ] Chat group management by team admins
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] File storage integration with team scoping
- [ ] API documentation
- [ ] Audit logs
- [ ] Two-factor authentication

---

Built with ❤️ by LNC Network
