-- ============================================
-- CLEANUP: Remove Old Media Tables
-- ============================================
-- Run this in Supabase SQL Editor to clean up existing tables

-- Drop the view first (depends on tables)
DROP VIEW IF EXISTS chat_messages_with_attachments CASCADE;

-- Drop chat_attachments table
DROP TABLE IF EXISTS chat_attachments CASCADE;

-- Drop content table
DROP TABLE IF EXISTS content CASCADE;

-- Remove has_attachment column from chat_messages if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'chat_messages' AND column_name = 'has_attachment') THEN
        ALTER TABLE chat_messages DROP COLUMN has_attachment;
    END IF;
END $$;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Cleanup complete!'; 
  RAISE NOTICE 'Dropped: content table, chat_attachments table, chat_messages_with_attachments view';
  RAISE NOTICE 'Removed: has_attachment column from chat_messages';
END $$;
