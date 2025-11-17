-- Updated Role System with Hierarchy
-- Run this in Supabase SQL Editor to update the roles

-- Clear existing roles
DELETE FROM user_roles;
DELETE FROM roles;

-- Insert new role hierarchy
INSERT INTO roles (name, description) VALUES
    ('super admin', 'Full access - can see and change everything'),
    ('admistater', 'View-only access - can see everything except database, cannot change anything'),
    ('dev team admin', 'Development team administrator - manage dev team and tasks'),
    ('social media team admin', 'Social media team administrator - manage social media team'),
    ('pr & outreach team admin', 'PR & Outreach team administrator - manage PR team'),
    ('design team admin', 'Design team administrator - manage design team'),
    ('dev member', 'Development team member'),
    ('social media member', 'Social media team member'),
    ('pr & outreach member', 'PR & Outreach team member'),
    ('design member', 'Design team member')
ON CONFLICT (name) DO NOTHING;

-- Verify roles were inserted
SELECT * FROM roles ORDER BY 
    CASE 
        WHEN name = 'super admin' THEN 1
        WHEN name = 'admistater' THEN 2
        WHEN name LIKE '%admin' THEN 3
        ELSE 4
    END,
    name;

-- Show count of roles
SELECT COUNT(*) as total_roles FROM roles;

COMMENT ON TABLE roles IS 'Role hierarchy: Super Admin > Admistater > Team Admins > Team Members';
