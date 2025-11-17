-- Migration script to update roles from old system to new organizational hierarchy
-- Run this in Supabase SQL Editor

-- Step 1: First run the setup-new-roles.sql to create new role structure
-- (Copy and paste the content of setup-new-roles.sql first)

-- Step 2: Migrate existing users to appropriate roles
-- This section helps map old roles to new ones

-- Example mappings (adjust as needed):
-- Old "admin" role → "super admin" or "admistater" or team admin
-- Old "dev member" role → "dev member" (same)
-- Old "editor" role → team admin or admistater
-- Old "user" role → team member

-- Check current user-role assignments
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

-- Step 3: Manual migration examples
-- Replace USER_EMAIL, USER_ID with actual values

-- Example: Upgrade an admin to super admin
-- DELETE FROM user_roles WHERE user_id = 'USER_ID';
-- INSERT INTO user_roles (user_id, role_id)
-- SELECT 'USER_ID', id FROM roles WHERE name = 'super admin';

-- Example: Assign multiple roles to a user
-- DELETE FROM user_roles WHERE user_id = 'USER_ID';
-- INSERT INTO user_roles (user_id, role_id)
-- SELECT 'USER_ID', id FROM roles WHERE name IN ('dev team admin', 'dev member');

-- Step 4: Clean up old roles (ONLY after all users are migrated!)
-- DELETE FROM roles WHERE name IN ('admin', 'editor', 'user');
-- Note: Keep 'dev member' if you're using it in the new system

-- Step 5: Verify migration
SELECT 
  u.email,
  u.display_name,
  array_agg(r.name) as new_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email, u.display_name
ORDER BY u.email;
