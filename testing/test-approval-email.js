// Test approval email using Gmail
import { sendRegistrationApprovedEmail } from '../lib/email-service-gmail.ts';

async function testApprovalEmail() {
    try {
        console.log('🚀 Sending test approval email via Gmail SMTP...\n');

        const result = await sendRegistrationApprovedEmail(
            'latenighthacker6@gmail.com',      // Email to send to (any email works with Gmail)
            'Test User',                    // User's name
            'User',                         // Role assigned
            'Development'                   // Team
        );

        if (result.success) {
            console.log('\n✅ SUCCESS! Approval email sent via Gmail!');
            console.log('📬 Check your inbox at: killer.u.421@gmail.com');
        } else {
            console.log('\n❌ FAILED to send email');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.error('\n❌ Error:', error);
    }
}

testApprovalEmail();
