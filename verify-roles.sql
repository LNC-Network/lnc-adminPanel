-- Verify and seed roles table
-- Run this in Supabase SQL Editor to ensure roles are properly set up

-- Check if roles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'roles'
) as roles_table_exists;

-- Insert default roles (if not already present)
INSERT INTO roles (name, description) VALUES
    ('admin', 'Full access to all features'),
    ('editor', 'Limited admin access'),
    ('user', 'Basic user access')
ON CONFLICT (name) DO NOTHING;

-- Verify roles were inserted
SELECT * FROM roles ORDER BY name;

-- Show count of roles
SELECT COUNT(*) as total_roles FROM roles;
