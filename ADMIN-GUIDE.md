# Quick Start Guide for Administrators

## Setting Up the New Role System

### Step 1: Update the Database

1. Log in to [Supabase Dashboard](https://supabase.com)
2. Navigate to your LNC Admin Panel project
3. Go to **SQL Editor**

**First, create the roles:** 4. Open the `setup-new-roles.sql` file from your project 5. Copy and paste the entire contents into the SQL Editor 6. Click **Run** to execute the script 7. Verify that 10 new roles have been created

**Then, assign permissions to roles:** 8. Open the `setup-role-permissions.sql` file from your project 9. Copy and paste the entire contents into the SQL Editor 10. Click **Run** to execute the script 11. Verify the output shows all roles have permissions assigned

### Step 2: Assign Your First Super Admin

```sql
-- Find your user ID
SELECT id, email FROM users WHERE email = 'your-email@lnc.com';

-- Assign super admin role (replace YOUR_USER_ID with the actual ID)
INSERT INTO user_roles (user_id, role_id)
SELECT 'YOUR_USER_ID', id FROM roles WHERE name = 'super admin';
```

### Step 3: Verify Your Role Assignment

1. Log out of the admin panel
2. Log back in
3. Check that you can see all tabs including Database
4. Verify you can create new users in Settings

### Step 4: Migrate Existing Users

Run this query to see all current users and their roles:

```sql
SELECT
  u.id,
  u.email,
  u.display_name,
  array_agg(r.name) as current_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email, u.display_name
ORDER BY u.email;
```

For each user, decide their new role(s) and run:

```sql
-- Delete old role assignments
DELETE FROM user_roles WHERE user_id = 'USER_ID_HERE';

-- Assign new role(s)
INSERT INTO user_roles (user_id, role_id)
SELECT 'USER_ID_HERE', id FROM roles WHERE name = 'new-role-name';
```

### Step 5: Test Permission Levels

#### Test as Super Admin:

- ✅ Can create users
- ✅ Can edit user roles
- ✅ Can delete users
- ✅ Can access Database tab
- ✅ Can approve registrations

#### Test as Admistater:

1. Create a test user with admistater role
2. Log in as that user
3. Verify:
   - ❌ Cannot create users (form disabled)
   - ❌ Cannot edit roles (buttons disabled)
   - ❌ Cannot delete users (button disabled)
   - ❌ Cannot access Database tab
   - ✅ Can view all other tabs

#### Test as Team Admin:

1. Create a test user with "dev team admin" role
2. Log in as that user
3. Verify:
   - ✅ Can view Settings (but not edit users)
   - ✅ Can access their team features
   - ❌ Cannot create/delete users
   - ❌ Cannot access Database tab

## Common Tasks

### Approving New User Registrations

1. Go to **Settings** tab
2. Click **Pending Registrations** tab
3. Review the user's information
4. Select appropriate role from "Approve as..." dropdown:
   - For regular team members: Select their team member role
   - For team leaders: Select their team admin role
   - For oversight: Select "admistater"
   - For system administrators: Select "super admin" (use sparingly!)

### Assigning Multiple Roles to a User

1. Go to **Settings** tab → **Users** tab
2. Find the user in the table
3. Click **Edit Roles** button
4. Check multiple role checkboxes:
   - Example: Both "dev team admin" AND "dev member"
   - Example: Multiple team admin roles for cross-functional leaders
5. Click **Save Roles**

### Creating a New User Manually

1. Must be logged in as **Super Admin**
2. Go to **Settings** tab
3. Fill in the Create New User form:
   - Email: Must be @lnc.com domain
   - Password: Minimum 6 characters
   - Role: Select primary role
4. Click **Create User**
5. Optionally add more roles via **Edit Roles** button

### Removing a User

1. Must be logged in as **Super Admin**
2. Go to **Settings** tab → **Users** tab
3. Find the user in the table
4. Click the trash icon (🗑️) next to their name
5. Confirm deletion

## Role Assignment Best Practices

### For Team Members

Assign the appropriate team member role based on their department:

- **Dev Member**: Development team
- **Social Media Member**: Social media team
- **PR & Outreach Member**: Public relations team
- **Design Member**: Design team

### For Team Leaders

Assign both team admin AND team member roles:

```sql
INSERT INTO user_roles (user_id, role_id)
SELECT 'USER_ID', id FROM roles
WHERE name IN ('dev team admin', 'dev member');
```

### For Oversight Roles

Use **Admistater** for people who need to:

- Monitor all activities
- View all content and users
- Generate reports
- But NOT make changes

### For System Administrators

Use **Super Admin** only for:

- IT administrators
- System maintainers
- People responsible for user management
- Keep this role limited to 2-3 people maximum

## Troubleshooting

### User Can't Log In

```sql
-- Check if user exists
SELECT * FROM users WHERE email = 'user@lnc.com';

-- Check if user has any roles
SELECT u.email, r.name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'user@lnc.com';
```

### User Has Wrong Permissions

```sql
-- Remove all roles
DELETE FROM user_roles WHERE user_id = 'USER_ID';

-- Assign correct role
INSERT INTO user_roles (user_id, role_id)
SELECT 'USER_ID', id FROM roles WHERE name = 'correct-role-name';
```

### Need to Delete Old Roles

Only do this AFTER migrating all users!

```sql
-- First verify no users have these roles
SELECT u.email, r.name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name IN ('admin', 'editor', 'user');

-- If empty, safe to delete
DELETE FROM roles WHERE name IN ('admin', 'editor', 'user');
```

## Security Recommendations

1. **Limit Super Admin Access**: Only 2-3 trusted people
2. **Use Admistater for Reporting**: Give view-only access to auditors/managers
3. **Assign Team Admins Carefully**: Only to team leaders who need management access
4. **Regular Audits**: Review user roles monthly
5. **Remove Inactive Users**: Delete accounts that haven't logged in for 90+ days

## Support

For issues or questions:

1. Check `ROLES.md` for detailed permission documentation
2. Review `SETTINGS-UPDATE.md` for technical implementation details
3. Contact the development team for system-level issues
