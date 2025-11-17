-- Check all chat groups
SELECT id, name, description, created_by, created_at 
FROM chat_groups 
ORDER BY created_at DESC;

-- Check all chat members
SELECT cm.group_id, cg.name as group_name, cm.user_id, u.email
FROM chat_members cm
JOIN chat_groups cg ON cm.group_id = cg.id
JOIN users u ON cm.user_id = u.id
ORDER BY cg.name, u.email;

-- Count members per group
SELECT cg.id, cg.name, COUNT(cm.user_id) as member_count
FROM chat_groups cg
LEFT JOIN chat_members cm ON cg.id = cm.group_id
GROUP BY cg.id, cg.name
ORDER BY cg.name;

-- Check if any user is member of all groups
SELECT u.email, COUNT(DISTINCT cm.group_id) as groups_count,
       (SELECT COUNT(*) FROM chat_groups) as total_groups
FROM users u
LEFT JOIN chat_members cm ON u.id = cm.user_id
GROUP BY u.id, u.email
ORDER BY groups_count DESC;
