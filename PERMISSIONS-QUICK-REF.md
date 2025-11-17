# Permission System Quick Reference

## 🔑 Setup Steps

1. Run `setup-new-roles.sql` → Creates 10 roles
2. Run `setup-role-permissions.sql` → Assigns permissions to roles
3. Assign users to roles via Settings UI or SQL

## 📊 Permission Summary

| Permission Code | Super Admin | Admistater | Team Admin | Team Member |
| --------------- | ----------- | ---------- | ---------- | ----------- |
| user.create     | ✅          | ❌         | ❌         | ❌          |
| user.read       | ✅          | ✅         | ✅         | ✅          |
| user.update     | ✅          | ❌         | ✅         | ❌          |
| user.delete     | ✅          | ❌         | ❌         | ❌          |
| content.create  | ✅          | ❌         | ✅         | ✅          |
| content.read    | ✅          | ✅         | ✅         | ✅          |
| content.update  | ✅          | ❌         | ✅         | ✅          |
| content.delete  | ✅          | ❌         | ✅         | ❌          |
| settings.read   | ✅          | ✅         | ✅         | ✅          |
| settings.write  | ✅          | ❌         | ✅         | ❌          |
| database.read   | ✅          | ❌         | ❌         | ❌          |
| database.write  | ✅          | ❌         | ❌         | ❌          |

**Total Permissions:**

- Super Admin: 12 (all)
- Admistater: 3 (read-only)
- Team Admins: 7 (team management)
- Team Members: 5 (basic work)

## 💻 Code Usage

### Server-Side (API Routes)

```typescript
import { userHasPermission, PERMISSIONS } from "@/lib/permission-check";

// Single permission check
if (await userHasPermission(userId, PERMISSIONS.USER_CREATE)) {
  // Allow action
}

// Multiple permission check (any)
if (
  await userHasAnyPermission(userId, [
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
  ])
) {
  // Allow action
}

// Multiple permission check (all)
if (
  await userHasAllPermissions(userId, [
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_WRITE,
  ])
) {
  // Allow action
}
```

### Client-Side (Components)

```typescript
import { isSuperAdmin, canEdit } from "@/lib/permissions";

// Role-based checks
const canEdit = !isAdmistater(userRoles);
const canCreateUser = isSuperAdmin(userRoles);

// Use in JSX
<Button disabled={!canEdit}>Edit</Button>;
```

## 🔍 SQL Queries

### View user permissions

```sql
SELECT p.code
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'user@lnc.com';
```

### View role permissions

```sql
SELECT r.name, p.code
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY r.name, p.code;
```

### Add permission to role

```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'dev team admin'
AND p.code = 'content.delete';
```

### Remove permission from role

```sql
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'team member')
AND permission_id = (SELECT id FROM permissions WHERE code = 'content.delete');
```

## 📝 API Protection Pattern

```typescript
export async function POST(request: Request) {
  // 1. Get user from session
  const userId = getUserIdFromSession(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Check permission
  if (!(await userHasPermission(userId, PERMISSIONS.USER_CREATE))) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // 3. Execute action
  // ... your logic here ...
}
```

## 🚨 Common Issues

**User can't access feature:**

```sql
-- Check their permissions
SELECT p.code FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'user@lnc.com';
```

**Role needs new permission:**

```sql
-- Add it
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'dev team admin' AND p.code = 'user.update';
```

## 📚 Files Reference

- `setup-role-permissions.sql` - Permission assignments
- `lib/permission-check.ts` - Server-side helpers
- `lib/permissions.ts` - Client-side helpers
- `app/api/example-with-permissions/route.ts` - Example usage
- `PERMISSIONS.md` - Full documentation

## 🎯 Best Practices

1. ✅ Always check permissions **server-side** in API routes
2. ✅ Use client-side checks only for **UI/UX** (hide buttons)
3. ✅ Use **PERMISSIONS constants** instead of strings
4. ✅ **Fail securely** - deny if check errors
5. ✅ **Log** permission denials for security
6. ❌ Never trust client-side permission checks
7. ❌ Don't hardcode permission strings
8. ❌ Don't skip server-side validation

## 🔐 Security Tips

- **Super Admin**: Limit to 2-3 people
- **Admistater**: Use for auditors/managers (view-only)
- **Team Admins**: Only for actual team leaders
- **Regular Audits**: Review permissions quarterly
- **Remove Inactive**: Delete unused accounts monthly
