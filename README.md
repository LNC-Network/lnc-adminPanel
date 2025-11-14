# LNC Admin Panel

A modern, full-featured admin panel built with Next.js 15, TypeScript, and Tailwind CSS. Features include user management, content management, database viewer, dynamic form builder, and more.

## 🚀 Features

- **Authentication System**: Secure JWT-based login with Supabase backend
- **User Management**: Add, view, and manage admin users
- **Content Management**: Upload and organize media files with grid/list views
- **Database Viewer**: Browse and manage database tables with search and export
- **Form Builder**: Create custom forms with drag-and-drop interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode**: Built-in theme switching with next-themes
- **Modern UI**: Beautiful components from shadcn/ui with Radix UI primitives

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18.x or higher
- pnpm (recommended) or npm
- A Supabase account and project

## 🛠️ Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/LNC-Network/lnc-adminPanel.git
   cd lnc-adminPanel
   ```

2. **Install dependencies:**

   ```bash
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
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: From Supabase project settings
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From Supabase project settings
   - `NEXT_PUBLIC_SITE_URL`: Your site URL (http://localhost:3000 for dev)

4. **Set up Supabase database:**

   Create a table in your Supabase project:

   ```sql
   CREATE TABLE adminpaneluser (
     user_id SERIAL PRIMARY KEY,
     user_email VARCHAR(255) UNIQUE NOT NULL,
     user_password VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Insert a default admin user (change credentials!)
   INSERT INTO adminpaneluser (user_email, user_password)
   VALUES ('admin@example.com', 'admin123');
   ```

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
│   │   ├── auth/            # Authentication endpoints
│   │   └── users/           # User management endpoints
│   ├── dashboard/           # Dashboard page
│   ├── login/               # Login page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page (redirects)
├── components/              # React components
│   ├── dashboard/           # Dashboard-specific components
│   │   ├── dashboard.tsx    # Main dashboard layout
│   │   ├── content.tsx      # Content management
│   │   ├── database.tsx     # Database viewer
│   │   ├── form-maker.tsx   # Form builder
│   │   └── settings.tsx     # User settings
│   ├── ui/                  # Reusable UI components
│   └── login-page.tsx       # Login component
├── lib/                     # Utility functions
│   ├── postgres/            # Database functions
│   ├── JWT.ts               # JWT utilities
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
5. **Implement password hashing** (currently stores plain text - use bcrypt in production)
6. **Set up CORS policies** appropriately
7. **Use HTTPS** in production

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is a product of LNC Network.

## 🆘 Support

For issues and questions:

- Create an issue on GitHub
- Contact: jit.nathdeb@gmail.com

## 🔄 Updates & Roadmap

Planned features:

- [ ] Password hashing with bcrypt
- [ ] Role-based access control
- [ ] File storage integration
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] API documentation
- [ ] Audit logs
- [ ] Two-factor authentication

---

Built with ❤️ by LNC Network
