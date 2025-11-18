-- Add missing columns to users table to support comprehensive user profiles
-- Adds: personal_email (for notifications) and team (department)

-- Add personal_email column
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_email TEXT;

-- Add team column
ALTER TABLE users ADD COLUMN IF NOT EXISTS team TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_personal_email ON users(personal_email);
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team);

-- Add comments describing the columns
COMMENT ON COLUMN users.personal_email IS 'User personal email for receiving notifications (not their work @lnc.com email)';
COMMENT ON COLUMN users.team IS 'Department or team the user belongs to (Development, Design, Marketing, etc.)';

-- Migrate existing real emails to personal_email (optional)
-- This moves non-@lnc.com emails to personal_email field
-- UPDATE users 
-- SET personal_email = email 
-- WHERE email NOT LIKE '%@lnc.com' AND personal_email IS NULL;

SELECT 'Migration complete! Added personal_email and team columns to users table.' as status;
