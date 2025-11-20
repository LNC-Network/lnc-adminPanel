-- Add personal_email column to users table for real email addresses
-- This allows users to have @lnc.com login emails while receiving notifications on their real email

-- Add personal_email column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS personal_email TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_personal_email ON users(personal_email);

-- Update existing users: if their email is NOT @lnc.com, move it to personal_email
-- This migrates any real emails to the personal_email field
UPDATE users 
SET personal_email = email 
WHERE email NOT LIKE '%@lnc.com' 
  AND personal_email IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN users.personal_email IS 'Real email address for notifications. Can be different from login email (@lnc.com).';

-- Example: View users with their login email and personal email
-- SELECT 
--   id,
--   email as login_email,
--   personal_email,
--   display_name,
--   created_at
-- FROM users
-- ORDER BY created_at DESC;
