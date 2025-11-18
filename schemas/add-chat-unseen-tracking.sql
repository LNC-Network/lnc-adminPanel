-- Add Unseen Message Tracking to Chat System
-- Run this in Supabase SQL Editor

-- 1. Add last_seen_at to chat_members to track when user last viewed messages
ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add is_read flag to chat_messages (optional, for individual message tracking)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 3. Create table to track unseen message notifications sent via email
CREATE TABLE IF NOT EXISTS chat_unseen_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    email_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, message_id)
);

-- 4. Create index for faster unseen message queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_group_created ON chat_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_members_last_seen ON chat_members(user_id, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_unseen_notifications_user_group ON chat_unseen_notifications(user_id, group_id);

-- 5. Function to count unseen messages for a user in a group
CREATE OR REPLACE FUNCTION get_unseen_message_count(p_user_id UUID, p_group_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_last_seen TIMESTAMPTZ;
    v_count INTEGER;
BEGIN
    -- Get user's last seen timestamp for this group
    SELECT last_seen_at INTO v_last_seen
    FROM chat_members
    WHERE user_id = p_user_id AND group_id = p_group_id;
    
    -- If user is not a member, return 0
    IF v_last_seen IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Count messages created after last_seen_at
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM chat_messages
    WHERE group_id = p_group_id
      AND created_at > v_last_seen
      AND user_id != p_user_id; -- Don't count user's own messages
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to get all unseen messages older than X hours
CREATE OR REPLACE FUNCTION get_unseen_messages_older_than(p_hours INTEGER DEFAULT 12)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    personal_email TEXT,
    group_id UUID,
    group_name TEXT,
    message_id UUID,
    message_text TEXT,
    message_created_at TIMESTAMPTZ,
    sender_email TEXT,
    hours_unseen NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        cm.user_id,
        u.email,
        u.personal_email,
        cm.group_id,
        cg.name,
        msg.id,
        msg.message,
        msg.created_at,
        sender.email,
        EXTRACT(EPOCH FROM (NOW() - msg.created_at)) / 3600 AS hours_unseen
    FROM chat_members cm
    INNER JOIN users u ON u.id = cm.user_id
    INNER JOIN chat_groups cg ON cg.id = cm.group_id
    INNER JOIN chat_messages msg ON msg.group_id = cm.group_id
    INNER JOIN users sender ON sender.id = msg.user_id
    LEFT JOIN chat_unseen_notifications notif 
        ON notif.user_id = cm.user_id 
        AND notif.message_id = msg.id
    WHERE msg.created_at > cm.last_seen_at -- Message is newer than last seen
      AND msg.user_id != cm.user_id -- Not user's own message
      AND msg.created_at < NOW() - INTERVAL '1 hour' * p_hours -- Older than X hours
      AND notif.id IS NULL -- Email not yet sent for this message
    ORDER BY cm.user_id, cm.group_id, msg.created_at;
END;
$$ LANGUAGE plpgsql;

-- 7. Enable RLS on new table
ALTER TABLE chat_unseen_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on chat_unseen_notifications" ON chat_unseen_notifications FOR ALL USING (true);

-- Success message
SELECT 'Chat unseen message tracking added successfully!' as message;
