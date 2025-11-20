-- STEP 1: Create all roles first
INSERT INTO roles (name, description) VALUES
    ('super admin', 'Full access - can see and change everything'),
    ('admistater', 'View-only access - can see everything except database, cannot change anything'),
    ('dev team admin', 'Development team administrator - manage dev team and tasks'),
    ('social media team admin', 'Social media team administrator - manage social media team'),
    ('content team admin', 'Content team administrator - manage content team'),
    ('pr & outreach team admin', 'PR & Outreach team administrator - manage PR team'),
    ('design team admin', 'Design team administrator - manage design team'),
    ('dev member', 'Development team member'),
    ('social media member', 'Social media team member'),
    ('content member', 'Content team member'),
    ('pr & outreach member', 'PR & Outreach team member'),
    ('design member', 'Design team member')
ON CONFLICT (name) DO NOTHING;
SET description = EXCLUDED.description;

-- STEP 2: Find your user ID (replace 'your-email@lnc.com' with your actual email)
-- First, let's see all users to find yours:
SELECT id, email, display_name FROM users ORDER BY created_at;

-- STEP 3: Once you know your user ID, assign super admin role
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from the query above

-- Example (uncomment and replace with your actual user ID):
-- DELETE FROM user_roles WHERE user_id = 'YOUR_USER_ID_HERE';
-- INSERT INTO user_roles (user_id, role_id)
-- SELECT 'YOUR_USER_ID_HERE', id FROM roles WHERE name = 'super admin';

-- STEP 4: Verify the assignment
-- SELECT 
--   u.email,
--   r.name as role_name
-- FROM users u
-- JOIN user_roles ur ON u.id = ur.user_id
-- JOIN roles r ON ur.role_id = r.id
-- WHERE u.id = 'YOUR_USER_ID_HERE';

-- After running this, log out and log back in to refresh your roles!
