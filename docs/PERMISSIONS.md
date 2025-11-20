# Permission System Documentation

## Overview

The LNC Admin Panel uses a database-driven permission system with three key tables:

- **roles**: Defines organizational roles (super admin, team admin, etc.)
- **permissions**: Defines granular permissions (user.create, content.read, etc.)
- **role_permissions**: Maps which permissions each role has

## Database Schema

### Tables

```sql
-- roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- role_permissions junction table
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- user_roles junction table
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
```

## Available Permissions

### User Management Permissions

- `user.create` - Create new users
- `user.read` - View user information
- `user.update` - Update user information
- `user.delete` - Delete users

### Content Management Permissions

- `content.create` - Create content
- `content.read` - View content
- `content.update` - Update content
- `content.delete` - Delete content

### Settings Permissions

- `settings.read` - View settings
- `settings.write` - Modify settings

### Database Permissions

- `database.read` - View database
- `database.write` - Modify database

## Role-Permission Mapping

### Super Admin

**All permissions** - Complete system access

```
✅ user.create, user.read, user.update, user.delete
✅ content.create, content.read, content.update, content.delete
✅ settings.read, settings.write
✅ database.read, database.write
```

### Admistater (View-Only)

**Read-only permissions** - Can view but not modify

```
✅ user.read
✅ content.read
✅ settings.read
❌ No create, update, or delete permissions
❌ No database access
```

### Team Admins (All 4 Teams)

**Team management permissions**

```
✅ user.read
✅ user.update (team members only)
✅ content.create, content.read, content.update, content.delete (team content)
✅ settings.read, settings.write (team settings)
❌ user.create, user.delete
❌ database access
```

### Team Members (All 4 Teams)

**Basic work permissions**

```
✅ user.read
✅ content.create, content.read, content.update (team content)
✅ settings.read
❌ content.delete
❌ user.create, user.update, user.delete
❌ settings.write
❌ database access
```

## Setup Instructions

### 1. Run Migration Scripts

Execute in this order:

**Step 1: Create roles**

```bash
# Run setup-new-roles.sql in Supabase SQL Editor
```

**Step 2: Assign permissions to roles**

```bash
# Run setup-role-permissions.sql in Supabase SQL Editor
```

### 2. Verify Setup

```sql
-- Check all roles have permissions
SELECT
  r.name as role_name,
  COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY permission_count DESC;
```

Expected results:

- super admin: 12 permissions
- team admins: 7 permissions each
- team members: 5 permissions each
- admistater: 3 permissions

## Usage in Code

### Server-Side (API Routes)

```typescript
import { userHasPermission, PERMISSIONS } from "@/lib/permission-check";

export async function POST(request: Request) {
  const userId = getUserIdFromSession(request);

  // Check if user can create users
  if (!(await userHasPermission(userId, PERMISSIONS.USER_CREATE))) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // Proceed with user creation
  // ...
}
```

### Available Helper Functions

```typescript
// Check single permission
await userHasPermission(userId, "user.create");

// Check if user has any of the permissions
await userHasAnyPermission(userId, ["user.update", "user.delete"]);

// Check if user has all permissions
await userHasAllPermissions(userId, ["user.read", "user.update"]);

// Get all user permissions
const permissions = await getUserPermissions(userId);
// Returns: ['user.read', 'content.create', ...]
```

### Permission Constants

```typescript
import { PERMISSIONS } from "@/lib/permission-check";

// User permissions
PERMISSIONS.USER_CREATE; // 'user.create'
PERMISSIONS.USER_READ; // 'user.read'
PERMISSIONS.USER_UPDATE; // 'user.update'
PERMISSIONS.USER_DELETE; // 'user.delete'

// Content permissions
PERMISSIONS.CONTENT_CREATE; // 'content.create'
PERMISSIONS.CONTENT_READ; // 'content.read'
PERMISSIONS.CONTENT_UPDATE; // 'content.update'
PERMISSIONS.CONTENT_DELETE; // 'content.delete'

// Settings permissions
PERMISSIONS.SETTINGS_READ; // 'settings.read'
PERMISSIONS.SETTINGS_WRITE; // 'settings.write'

// Database permissions
PERMISSIONS.DATABASE_READ; // 'database.read'
PERMISSIONS.DATABASE_WRITE; // 'database.write'
```

## Client-Side Permission Checking

For client-side, continue using the role-based helpers from `lib/permissions.ts`:

```typescript
import { isSuperAdmin, canEdit, canAccessDatabase } from "@/lib/permissions";

const userRoles = ["super admin"];

if (isSuperAdmin(userRoles)) {
  // Show admin features
}

if (canEdit(userRoles)) {
  // Enable edit buttons
}

if (canAccessDatabase(userRoles)) {
  // Show database tab
}
```

## API Route Protection Examples

### Example 1: Protecting User Creation

```typescript
// app/api/users/create/route.ts
import { userHasPermission, PERMISSIONS } from "@/lib/permission-check";

export async function POST(request: Request) {
  const userId = getUserIdFromSession(request);

  if (!(await userHasPermission(userId, PERMISSIONS.USER_CREATE))) {
    return NextResponse.json(
      { error: "Only Super Admin can create users" },
      { status: 403 }
    );
  }

  // Create user logic
}
```

### Example 2: Protecting Content Updates

```typescript
// app/api/content/update/route.ts
import { userHasPermission, PERMISSIONS } from "@/lib/permission-check";

export async function PATCH(request: Request) {
  const userId = getUserIdFromSession(request);

  if (!(await userHasPermission(userId, PERMISSIONS.CONTENT_UPDATE))) {
    return NextResponse.json(
      { error: "You do not have permission to update content" },
      { status: 403 }
    );
  }

  // Update content logic
}
```

### Example 3: Multiple Permission Check

```typescript
// app/api/settings/update/route.ts
import { userHasAllPermissions, PERMISSIONS } from "@/lib/permission-check";

export async function PATCH(request: Request) {
  const userId = getUserIdFromSession(request);

  // Require both read and write permissions
  if (
    !(await userHasAllPermissions(userId, [
      PERMISSIONS.SETTINGS_READ,
      PERMISSIONS.SETTINGS_WRITE,
    ]))
  ) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  // Update settings logic
}
```

## Adding New Permissions

### Step 1: Add to Database

```sql
-- Add new permission
INSERT INTO permissions (code, description)
VALUES ('chat.create', 'Create chat groups');

-- Assign to roles that should have it
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('super admin', 'dev team admin')
AND p.code = 'chat.create';
```

### Step 2: Add Constant (Optional)

```typescript
// In lib/permission-check.ts
export const PERMISSIONS = {
  // ... existing permissions ...
  CHAT_CREATE: "chat.create",
} as const;
```

### Step 3: Use in Code

```typescript
import { userHasPermission, PERMISSIONS } from "@/lib/permission-check";

if (await userHasPermission(userId, PERMISSIONS.CHAT_CREATE)) {
  // Allow chat creation
}
```

## Best Practices

1. **Always check permissions server-side** - Client-side checks are for UX only
2. **Use permission constants** - Avoid hardcoded strings
3. **Fail securely** - Deny access if permission check fails or errors
4. **Log permission denials** - For security auditing
5. **Cache user permissions** - Consider caching for performance
6. **Use specific permissions** - Prefer granular over broad permissions

## Troubleshooting

### User can't access feature

```sql
-- Check what permissions they have
SELECT p.code, p.description
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'user@lnc.com';
```

### Role missing permissions

```sql
-- Check permissions for a role
SELECT p.code, p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'dev team admin';
```

### Add missing permission to role

```sql
-- Add permission to role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'dev team admin'
AND p.code = 'content.delete';
```

## Migration from Old System

If you have existing role checks like `isAdmin`, map them:

```typescript
// Old way
if (isAdmin) {
  /* ... */
}

// New way (server-side)
if (await userHasPermission(userId, PERMISSIONS.USER_CREATE)) {
  /* ... */
}

// New way (client-side)
if (isSuperAdmin(userRoles)) {
  /* ... */
}
```

## Security Considerations

1. **Never trust client-side checks** - Always validate server-side
2. **Use HTTPS only** - Protect permission checks in transit
3. **Audit permission changes** - Log who modifies role_permissions
4. **Regular reviews** - Audit user permissions quarterly
5. **Principle of least privilege** - Grant minimum necessary permissions
6. **Separate sensitive data** - Use database.write sparingly

## Support

For technical issues:

- Check `setup-role-permissions.sql` for permission mappings
- Review `lib/permission-check.ts` for usage examples
- See `app/api/example-with-permissions/route.ts` for implementation patterns
