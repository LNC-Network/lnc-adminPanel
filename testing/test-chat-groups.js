// Test script to check chat groups
// Run with: node test-chat-groups.js

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bjlpvbiyjpcjgvpdzvcy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbHB2Yml5anBjamd2cGR6dmN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NDMxMSwiZXhwIjoyMDc4NzcwMzExfQ.-J_Fgji66NXzVduMR-42fml_zbUeQYWjI8u55cEh4I8';

async function checkGroups() {
    try {
        console.log('Checking all groups...');
        const groupsRes = await fetch(`${SUPABASE_URL}/rest/v1/chat_groups?select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        const groups = await groupsRes.json();
        console.log('All groups:', groups);

        console.log('\nChecking all chat members...');
        const membersRes = await fetch(`${SUPABASE_URL}/rest/v1/chat_members?select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        const members = await membersRes.json();
        console.log('All members:', members);

        console.log('\nChecking all users...');
        const usersRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,email`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        const users = await usersRes.json();
        console.log('All users:', users);

    } catch (error) {
        console.error('Error:', error);
    }
}

checkGroups();
