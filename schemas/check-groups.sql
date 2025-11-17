-- Check all chat groups in database
SELECT * FROM chat_groups ORDER BY created_at DESC;

-- Check if LNC DEV group exists
SELECT * FROM chat_groups WHERE name ILIKE '%LNC%' OR name ILIKE '%DEV%';

-- Count total groups
SELECT COUNT(*) as total_groups FROM chat_groups;

-- Check group members
SELECT 
    cg.name as group_name,
    u.email as member_email,
    cm.joined_at
FROM chat_groups cg
LEFT JOIN chat_members cm ON cg.id = cm.group_id
LEFT JOIN users u ON cm.user_id = u.id
ORDER BY cg.name, cm.joined_at;
