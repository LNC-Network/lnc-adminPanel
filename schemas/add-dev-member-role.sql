-- Add DEV MEMBER role
-- Run this in Supabase SQL Editor to add the new role

-- Insert the new role
INSERT INTO roles (name, description) VALUES
    ('dev member', 'Development team member')
ON CONFLICT (name) DO NOTHING;

-- Verify the role was added
SELECT * FROM roles ORDER BY name;

-- Optional: Assign dev member role to a user (replace USER_EMAIL with actual email)
-- First, get the user id and role id
-- SELECT u.id as user_id, r.id as role_id 
-- FROM users u, roles r 
-- WHERE u.email = 'USER_EMAIL' AND r.name = 'dev member';

-- Then insert into user_roles (replace the UUIDs with the ones from above query)
-- INSERT INTO user_roles (user_id, role_id) 
-- VALUES ('USER_UUID_HERE', 'ROLE_UUID_HERE')
-- ON CONFLICT (user_id, role_id) DO NOTHING;
