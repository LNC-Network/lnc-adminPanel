# Role System Documentation

## Overview
The LNC Admin Panel now uses a hierarchical organizational role structure with 10 distinct roles.

## Role Hierarchy

### 1. Super Admin
- **Full Control**: Complete access to all features
- **Can**:
  - Create, edit, and delete users
  - Assign any role to any user
  - Access all tabs (Dashboard, Tickets, Database, Chat, Content, Settings)
  - Manage all teams and content
  - View and edit everything

### 2. Admistater (View-Only Oversight)
- **Read-Only**: Can view everything but cannot make changes
- **Can**:
  - View all tabs EXCEPT Database
  - See all users, tickets, content, chat groups
- **Cannot**:
  - Edit, create, or delete anything
  - Access Database tab
  - Approve/reject registrations
  - Modify user roles

### 3. Team Admins (4 roles)
- **Dev Team Admin**
- **Social Media Team Admin**
- **PR & Outreach Team Admin**
- **Design Team Admin**

**Capabilities**:
- Manage their team's content and forms
- Create chat groups and add members from their team
- View and edit team-specific items
- Cannot access other teams' content
- Cannot create/delete users
- Cannot access Database tab

### 4. Team Members (4 roles)
- **Dev Member**
- **Social Media Member**
- **PR & Outreach Member**
- **Design Member**

**Capabilities**:
- View and work with their team's content
- Participate in their team's chat groups
- Dev Members have special access to Tickets tab
- Cannot edit settings or manage users
- Cannot access Database tab
- Cannot create chat groups (only team admins can)

## Permission Matrix

| Feature | Super Admin | Admistater | Team Admin | Team Member |
|---------|-------------|------------|------------|-------------|
| Create Users | ✅     | ❌ | ❌ | ❌ |
| Edit User Roles | ✅ | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ | ❌ |
| Approve Registrations | ✅ | ❌ | ❌ | ❌ |
| Access Database | ✅ | ❌ | ❌ | ❌ |
| View All Content | ✅ | ✅ | ❌ (team only) | ❌ (team only) |
| Edit Team Content | ✅ | ❌ | ✅ (own team) | ❌ |
| Create Chat Groups | ✅ | ❌ | ✅ (own team) | ❌ |
| Access Tickets | ✅ | ✅ | ✅ (dev only) | ✅ (dev only) |

## Multi-Role Assignment

Users can have multiple roles simultaneously. For example:
- A user could be both "dev team admin" AND "dev member"
- A user could be "social media team admin" AND "social media member"

This allows for flexible permission structures.

## Database Schema

### roles table
```sql
- id (primary key)
- name (unique)
- description
- created_at
```

### user_roles table
```sql
- user_id (foreign key → users.id)
- role_id (foreign key → roles.id)
Primary key: (user_id, role_id)
```

## Migration Steps

1. Run `setup-new-roles.sql` in Supabase SQL Editor
2. Use `migrate-roles.sql` to check current assignments
3. Manually assign new roles to existing users
4. Clean up old roles
5. Test permissions in the application

## Team Mapping

```javascript
Dev Team:
- dev team admin
- dev member

Social Media Team:
- social media team admin
- social media member

PR & Outreach Team:
- pr & outreach team admin
- pr & outreach member

Design Team:
- design team admin
- design member
```

## Special Rules

1. **Super Admin** is the only role that can:
   - Create new users
   - Delete users
   - Access the Database tab

2. **Admistater** has view-only access to everything except Database

3. **Team Admins** can only manage their own team's resources

4. **Dev Team** (admin and members) are the only ones who can access Tickets

5. All roles can view Dashboard and their permitted tabs

## Default Role Assignment

When approving new user registrations, assign based on their team:
- If they need admin privileges for their team: assign team admin role
- If they're a regular team member: assign team member role
- Only assign "super admin" or "admistater" for special cases
