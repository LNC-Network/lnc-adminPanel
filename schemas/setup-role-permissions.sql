-- Setup Role Permissions Mapping
-- This script assigns permissions to each role based on the organizational hierarchy
-- Run this AFTER setup-new-roles.sql has been executed

-- First, let's verify we have all the roles and permissions
-- SELECT * FROM roles ORDER BY name;
-- SELECT * FROM permissions ORDER BY code;

-- Clear existing role-permission mappings (if any)
DELETE FROM role_permissions;

-- ============================================
-- SUPER ADMIN - Full access to everything
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super admin';

-- ============================================
-- ADMISTATER - View-only access (no write/delete, no database)
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admistater'
AND p.code IN (
  'user.read',           -- View user information
  'content.read',        -- View content
  'settings.read'        -- View settings
);

-- ============================================
-- DEV TEAM ADMIN - Manage dev team + dev access
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'dev team admin'
AND p.code IN (
  'user.read',           -- View user information
  'user.update',         -- Update user information (team members)
  'content.read',        -- View content
  'content.create',      -- Create content
  'content.update',      -- Update content
  'content.delete',      -- Delete content
  'settings.read',       -- View settings
  'settings.write'       -- Modify settings (team-specific)
);

-- ============================================
-- SOCIAL MEDIA TEAM ADMIN - Manage social media team
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'social media team admin'
AND p.code IN (
  'user.read',           -- View user information
  'user.update',         -- Update user information (team members)
  'content.read',        -- View content
  'content.create',      -- Create content
  'content.update',      -- Update content
  'content.delete',      -- Delete content
  'settings.read',       -- View settings
  'settings.write'       -- Modify settings (team-specific)
);

-- ============================================
-- PR & OUTREACH TEAM ADMIN - Manage PR team
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'pr & outreach team admin'
AND p.code IN (
  'user.read',           -- View user information
  'user.update',         -- Update user information (team members)
  'content.read',        -- View content
  'content.create',      -- Create content
  'content.update',      -- Update content
  'content.delete',      -- Delete content
  'settings.read',       -- View settings
  'settings.write'       -- Modify settings (team-specific)
);

-- ============================================
-- DESIGN TEAM ADMIN - Manage design team
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'design team admin'
AND p.code IN (
  'user.read',           -- View user information
  'user.update',         -- Update user information (team members)
  'content.read',        -- View content
  'content.create',      -- Create content
  'content.update',      -- Update content
  'content.delete',      -- Delete content
  'settings.read',       -- View settings
  'settings.write'       -- Modify settings (team-specific)
);

-- ============================================
-- DEV MEMBER - Development team member
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'dev member'
AND p.code IN (
  'user.read',           -- View user information
  'content.read',        -- View content
  'content.create',      -- Create content
  'content.update',      -- Update content
  'settings.read'        -- View settings
);

-- ============================================
-- SOCIAL MEDIA MEMBER - Social media team member
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'social media member'
AND p.code IN (
  'user.read',           -- View user information
  'content.read',        -- View content
  'content.create',      -- Create content
  'content.update',      -- Update content
  'settings.read'        -- View settings
);

-- ============================================
-- PR & OUTREACH MEMBER - PR team member
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'pr & outreach member'
AND p.code IN (
  'user.read',           -- View user information
  'content.read',        -- View content
  'content.create',      -- Create content
  'content.update',      -- Update content
  'settings.read'        -- View settings
);

-- ============================================
-- DESIGN MEMBER - Design team member
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'design member'
AND p.code IN (
  'user.read',           -- View user information
  'content.read',        -- View content
  'content.create',      -- Create content
  'content.update',      -- Update content
  'settings.read'        -- View settings
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- View all role-permission mappings
SELECT 
  r.name as role_name,
  COUNT(rp.permission_id) as permission_count,
  array_agg(p.code ORDER BY p.code) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name
ORDER BY r.name;

-- View detailed permissions by role
SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.description as permission_description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY r.name, p.code;

-- Check if all roles have at least one permission
SELECT 
  r.name as role_name,
  COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
HAVING COUNT(rp.permission_id) = 0
ORDER BY r.name;
