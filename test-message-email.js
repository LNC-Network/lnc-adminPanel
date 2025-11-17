// Test email by calling the API endpoint
const SUPABASE_URL = 'https://bjlpvbiyjpcjgvpdzvcy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbHB2Yml5anBjamd2cGR6dmN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NDMxMSwiZXhwIjoyMDc4NzcwMzExfQ.-J_Fgji66NXzVduMR-42fml_zbUeQYWjI8u55cEh4I8';

async function sendTestMessage() {
  console.log('Sending test message to trigger email notification...\n');

  // Get a test user and group
  const usersRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,email&limit=1`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const users = await usersRes.json();
  
  const groupsRes = await fetch(`${SUPABASE_URL}/rest/v1/chat_groups?select=id,name&limit=1`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const groups = await groupsRes.json();

  if (users.length === 0 || groups.length === 0) {
    console.log('No users or groups found. Please create a group first.');
    return;
  }

  const user = users[0];
  const group = groups[0];

  console.log(`Sending message as: ${user.email}`);
  console.log(`To group: ${group.name}\n`);

  // Send message via API (this will trigger email notifications)
  const response = await fetch('http://localhost:3000/api/chat/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      group_id: group.id,
      user_id: user.id,
      message: '🧪 This is a test message to verify email notifications are working! The system should send emails to all group members.',
      is_admin: true
    })
  });

  const result = await response.json();
  console.log('API Response:', result);
  
  if (result.success) {
    console.log('\n✅ Message sent! Email notifications should be delivered to group members.');
    console.log('Check your inbox (may take a few seconds).');
  } else {
    console.log('\n❌ Failed to send message:', result.error);
  }
}

sendTestMessage().catch(console.error);
