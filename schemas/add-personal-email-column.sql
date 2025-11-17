-- Add personal_email column to pending_users table
-- This will store the user's personal email for notifications

ALTER TABLE pending_users 
ADD COLUMN IF NOT EXISTS personal_email TEXT;

COMMENT ON COLUMN pending_users.personal_email IS 'User personal email for receiving notifications (not their work @lnc.com email)';

-- Optional: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_users_personal_email ON pending_users(personal_email);
