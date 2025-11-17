-- COPY AND PASTE THIS ENTIRE SCRIPT INTO SUPABASE SQL EDITOR
-- This will create all the roles needed for the system

-- First, let's see what roles currently exist
SELECT * FROM roles;

-- Delete old roles and start fresh (optional - comment out if you want to keep existing)
-- DELETE FROM user_roles;
-- DELETE FROM roles;

-- Insert all new roles
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
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

-- Verify all roles were inserted
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

-- Show count
SELECT COUNT(*) as total_roles FROM roles;
