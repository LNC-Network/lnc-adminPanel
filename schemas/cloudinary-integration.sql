-- ============================================
-- CLOUDINARY INTEGRATION SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor to add Cloudinary support

-- Create content table if it doesn't exist
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    tags TEXT[],
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    cloudinary_id TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    resource_type TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for content table
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_category ON content(category);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_cloudinary_id ON content(cloudinary_id);
CREATE INDEX IF NOT EXISTS idx_content_is_deleted ON content(is_deleted);

-- For existing content tables, add Cloudinary columns (this won't run if table was just created)
DO $$ 
BEGIN
    -- Check if cloudinary_id column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'content' AND column_name = 'cloudinary_id') THEN
        ALTER TABLE content ADD COLUMN cloudinary_id TEXT;
        ALTER TABLE content ADD COLUMN url TEXT;
        ALTER TABLE content ADD COLUMN thumbnail_url TEXT;
        ALTER TABLE content ADD COLUMN resource_type TEXT;
    END IF;
END $$;

-- Create chat_attachments table for media in chat
CREATE TABLE IF NOT EXISTS chat_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    cloudinary_id TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    resource_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_id ON chat_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_group_id ON chat_attachments(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_user_id ON chat_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_created_at ON chat_attachments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_cloudinary_id ON chat_attachments(cloudinary_id);

-- Add has_attachment column to chat_messages table
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS has_attachment BOOLEAN DEFAULT FALSE;

-- Create view for messages with attachments
CREATE OR REPLACE VIEW chat_messages_with_attachments AS
SELECT 
    cm.*,
    ca.id AS attachment_id,
    ca.file_name,
    ca.file_type,
    ca.file_size,
    ca.cloudinary_id,
    ca.url,
    ca.thumbnail_url,
    ca.resource_type
FROM chat_messages cm
LEFT JOIN chat_attachments ca ON cm.id = ca.message_id
ORDER BY cm.created_at DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_attachments TO service_role;
GRANT SELECT ON chat_messages_with_attachments TO service_role;

-- Add comments
COMMENT ON TABLE chat_attachments IS 'Stores media files (images/videos) uploaded in chat, with Cloudinary references';
COMMENT ON COLUMN content.cloudinary_id IS 'Cloudinary public ID for direct access';
COMMENT ON COLUMN content.url IS 'Cloudinary secure URL';
COMMENT ON COLUMN content.thumbnail_url IS 'Cloudinary thumbnail URL for previews';
COMMENT ON COLUMN content.resource_type IS 'Cloudinary resource type (image/video)';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Cloudinary integration schema created successfully!'; 
  RAISE NOTICE 'Updated content table with Cloudinary columns';
  RAISE NOTICE 'Created chat_attachments table for media sharing';
END $$;
