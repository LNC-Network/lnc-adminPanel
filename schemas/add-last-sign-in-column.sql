-- Add last_sign_in_at column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

COMMENT ON COLUMN users.last_sign_in_at IS 'Timestamp of the user last successful login';

-- Create index for better performance when filtering by last sign in
CREATE INDEX IF NOT EXISTS idx_users_last_sign_in_at ON users(last_sign_in_at DESC);
