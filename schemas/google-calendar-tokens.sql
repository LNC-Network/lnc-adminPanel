-- Google Calendar OAuth tokens storage
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id ON google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_expires_at ON google_calendar_tokens(expires_at);

-- Enable RLS
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Service role can manage google tokens" ON google_calendar_tokens;
CREATE POLICY "Service role can manage google tokens"
  ON google_calendar_tokens
  FOR ALL
  USING (true);

-- Users can only see their own tokens
DROP POLICY IF EXISTS "Users can view own tokens" ON google_calendar_tokens;
CREATE POLICY "Users can view own tokens"
  ON google_calendar_tokens
  FOR SELECT
  USING (user_id = auth.uid());
