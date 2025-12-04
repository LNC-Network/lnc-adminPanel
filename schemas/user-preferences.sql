-- Add avatar_url column to users table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Create user_preferences table only if it doesn't exist
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add comments describing the columns
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile picture';
COMMENT ON TABLE user_preferences IS 'Stores user notification and display preferences';

-- Function to automatically create preferences for new users
CREATE OR REPLACE FUNCTION create_default_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences when a user is created
DROP TRIGGER IF EXISTS on_user_created_preferences ON users;
CREATE TRIGGER on_user_created_preferences
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_default_preferences();

-- Create default preferences for existing users who don't have them
INSERT INTO user_preferences (user_id)
SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;

SELECT 'User preferences table created and avatar_url column added!' as status;
