-- Add team column to users table for storing department/team information
-- This matches the registration form field

ALTER TABLE users ADD COLUMN IF NOT EXISTS team TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team);

-- Optional: Add comment describing the column
COMMENT ON COLUMN users.team IS 'Department or team the user belongs to (Development, Design, Marketing, etc.)';
