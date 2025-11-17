// Test email notifications
import { sendNewGroupNotification, sendNewMessageNotification } from './lib/chat-email-service.js';

async function testEmails() {
    console.log('Testing email notifications...\n');

    // Test 1: New Group Notification
    console.log('1. Sending new group notification...');
    const groupResult = await sendNewGroupNotification({
        recipientEmail: 'jitdebnathinkolkata@gmail.com',
        recipientName: 'Test User',
        groupName: 'Test Group - LNC Dev Team',
        groupDescription: 'This is a test group notification from the admin panel',
        createdBy: 'admin@lnc.com',
    });
    console.log('New group notification result:', groupResult);
    console.log('');

    // Wait 2 seconds before sending next email
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: New Message Notification
    console.log('2. Sending new message notification...');
    const messageResult = await sendNewMessageNotification({
        recipientEmail: 'jitdebnathinkolkata@gmail.com',
        recipientName: 'Test User',
        groupName: 'Test Group - LNC Dev Team',
        senderEmail: 'admin@lnc.com',
        message: 'This is a test message notification. Hello from the LNC Admin Panel chat system! 👋',
    });
    console.log('New message notification result:', messageResult);
    console.log('');

    console.log('✅ Test complete! Check your email inbox.');
}

testEmails().catch(console.error);
