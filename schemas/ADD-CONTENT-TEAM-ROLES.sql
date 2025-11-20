-- ============================================
-- ADD CONTENT TEAM ROLES TO DATABASE
-- ============================================
-- Run this in Supabase SQL Editor to add Content Team roles
-- This is a NON-DESTRUCTIVE update - it only adds new roles

-- Step 1: Add Content Team Admin role
INSERT INTO roles (name, description) VALUES
    ('content team admin', 'Content team administrator - manage content team')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

-- Step 2: Add Content Team Member role
INSERT INTO roles (name, description) VALUES
    ('content member', 'Content team member')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

-- Step 3: Verify the new roles were added
SELECT 
    id,
    name,
    description,
    created_at
FROM roles 
WHERE name IN ('content team admin', 'content member')
ORDER BY name;

-- Step 4: Show all roles in hierarchy order
SELECT 
    id,
    name,
    description,
    created_at
FROM roles 
ORDER BY 
    CASE 
        WHEN name = 'super admin' THEN 1
        WHEN name = 'admistater' THEN 2
        WHEN name LIKE '%admin' THEN 3
        ELSE 4
    END,
    name;

-- Step 5: Count total roles (should be 13 now)
SELECT COUNT(*) as total_roles FROM roles;

-- ============================================
-- OPTIONAL: Add Content Team Permissions
-- ============================================
-- If you're using the role_permissions table, add these:

-- Content Team Admin permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'content team admin'
AND p.code IN (
  'user.read',           -- View user information
  'user.update',         -- Update user information (team members)
  'content.read',        -- View content
  'content.create',      -- Create content
  'content.update',      -- Update content
  'content.delete',      -- Delete content
  'settings.read',       -- View settings
  'settings.write'       -- Modify settings (team-specific)
)
ON CONFLICT DO NOTHING;

-- Content Team Member permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'content member'
AND p.code IN (
  'user.read',           -- View user information
  'content.read',        -- View content
  'content.create',      -- Create content
  'content.update',      -- Update content
  'settings.read'        -- View settings
)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check Content Team role permissions
SELECT 
  r.name as role_name,
  COUNT(rp.permission_id) as permission_count,
  array_agg(p.code ORDER BY p.code) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('content team admin', 'content member')
GROUP BY r.id, r.name
ORDER BY r.name;

-- ============================================
-- ASSIGN CONTENT TEAM ROLES TO USERS (OPTIONAL)
-- ============================================

-- Example: Assign Content Team Admin role to a user
-- Replace 'USER_EMAIL_HERE' with actual email
/*
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r
WHERE u.email = 'content.admin@lnc.com'
AND r.name = 'content team admin'
ON CONFLICT DO NOTHING;
*/

-- Example: Assign Content Team Member role to a user
/*
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r
WHERE u.email = 'content.member@lnc.com'
AND r.name = 'content member'
ON CONFLICT DO NOTHING;
*/

-- Verify user role assignments
/*
SELECT 
  u.email,
  u.display_name,
  array_agg(r.name) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email IN ('content.admin@lnc.com', 'content.member@lnc.com')
GROUP BY u.id, u.email, u.display_name;
*/

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Content Team roles added successfully!'; 
  RAISE NOTICE 'Total roles in system: %', (SELECT COUNT(*) FROM roles);
END $$;
