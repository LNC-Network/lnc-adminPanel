# LNC Admin Panel Documentation

> **Comprehensive documentation for the LNC Admin Panel - A modern Progressive Web App with role-based permissions, email notifications, and real-time chat.**

## 📚 Documentation Index

This documentation is organized into focused guides for different audiences:

### For Administrators
- **[User Guide](USER-GUIDE.md)** - User management, permissions, and registration approval

### For Developers
- **[Setup Guide](SETUP-GUIDE.md)** - Initial setup instructions and configuration
- **[Architecture](ARCHITECTURE.md)** - Technical architecture with diagrams
- **[Developer Guide](DEVELOPER-GUIDE.md)** - Testing, troubleshooting, and feature documentation

---

## 🚀 Quick Start

### First Time Setup
1. Follow the **[Setup Guide](SETUP-GUIDE.md)** to configure your environment
2. Run database migrations
3. Set up email service (Resend)
4. Configure PWA settings

### Daily Administration
1. Review **[User Guide](USER-GUIDE.md)** for common tasks
2. Approve pending user registrations
3. Manage roles and permissions

### Development
1. Check **[Developer Guide](DEVELOPER-GUIDE.md)** for testing procedures
2. Review **[Architecture](ARCHITECTURE.md)** for system design
3. Use API reference for integrations

---

## 🏗️ System Overview

![System Architecture Diagram](./images/lnc_system_overview_1770225437051.png)

---

## 📖 Core Features

### Permission System
- **10 predefined roles** (Super Admin, Adminstater, 4 Team Admins, 4 Team Members)
- **12 granular permissions** (user, content, settings, database operations)
- **Multi-role support** - Users can have multiple roles simultaneously

### Email Notifications
- **Template-based emails** for common scenarios
- **Automated notifications** for user events (welcome, approval, role changes)
- **Queue system** with retry logic for failed emails

### User Registration
- **Self-service registration** with admin approval
- **Email domain validation** (@lnc.com required)
- **Team assignment** during registration

### Progressive Web App
- **Installable** on desktop and mobile devices
- **Offline support** with service worker caching
- **Mobile responsive** design across all components

---

## 🎯 Common Tasks

### For Administrators

| Task | Guide | Section |
|------|-------|---------|
| Approve new user | [User Guide](USER-GUIDE.md) | User Registration Workflow |
| Assign roles | [User Guide](USER-GUIDE.md) | Managing Roles |
| Update permissions | [User Guide](USER-GUIDE.md) | Permission Management |
| View email queue | [Developer Guide](DEVELOPER-GUIDE.md) | Email System |

### For Developers

| Task | Guide | Section |
|------|-------|---------|
| Install dependencies | [Setup Guide](SETUP-GUIDE.md) | Initial Setup |
| Run database migrations | [Setup Guide](SETUP-GUIDE.md) | Database Setup |
| Configure email service | [Setup Guide](SETUP-GUIDE.md) | Email Configuration |
| Test PWA functionality | [Developer Guide](DEVELOPER-GUIDE.md) | PWA Testing |
| Review system architecture | [Architecture](ARCHITECTURE.md) | All Sections |

---

## 🔐 Security Overview

- **JWT-based authentication** with refresh tokens
- **Argon2 password hashing** for secure storage
- **Row Level Security (RLS)** in Supabase database
- **Role-based access control** at API and UI levels
- **HTTPS required** for PWA functionality

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with custom role system
- **Email**: Resend API with template engine
- **PWA**: Service Worker with offline caching

---

## 📞 Support

### Getting Help

1. **Setup Issues**: Check [Setup Guide](SETUP-GUIDE.md) troubleshooting section
2. **Permission Errors**: Review [User Guide](USER-GUIDE.md) permission matrix
3. **Email Problems**: See [Developer Guide](DEVELOPER-GUIDE.md) email debugging
4. **Architecture Questions**: Consult [Architecture](ARCHITECTURE.md) diagrams

### Documentation Structure

```
docs/
├── README.md              ← You are here
├── ARCHITECTURE.md        ← System design and diagrams
├── SETUP-GUIDE.md        ← Installation and configuration
├── USER-GUIDE.md         ← Admin and user management
└── DEVELOPER-GUIDE.md    ← Testing and development
```

---

**Last Updated**: February 2026  
**Version**: 2.0 (Restructured Documentation)
