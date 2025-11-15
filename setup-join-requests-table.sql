-- Chat Join Requests table
-- Run this in Supabase SQL Editor to add join request functionality

CREATE TABLE IF NOT EXISTS chat_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id, status)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_join_requests_group_id ON chat_join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON chat_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON chat_join_requests(status);

-- Add to main database-setup.sql as well
COMMENT ON TABLE chat_join_requests IS 'Stores user requests to join chat groups';
