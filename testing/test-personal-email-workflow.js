// Test personal_email workflow for rohit@lnc.com
// This tests: fetch user -> update personal_email -> send test email

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        if (line.trim().startsWith('#') || !line.trim()) return;
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            const commentIndex = value.indexOf('//');
            if (commentIndex !== -1) {
                value = value.substring(0, commentIndex).trim();
            }
            value = value.replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
}

const API_BASE = 'http://localhost:3000';
const TEST_USER_EMAIL = 'rohit@lnc.com';
const TEST_PERSONAL_EMAIL = 'kundurohit53@gmail.com'; // Send test to same Gmail

// Gmail transporter
const gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

console.log('\n========================================');
console.log('🧪 Testing Personal Email Workflow');
console.log('========================================\n');

async function step1_fetchUser() {
    console.log('📋 Step 1: Fetching user list...');
    try {
        const https = require('http');
        const res = await new Promise((resolve, reject) => {
            const req = https.get(`${API_BASE}/api/users/list`, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    resolve({ ok: res.statusCode === 200, json: async () => JSON.parse(data), status: res.statusCode, text: async () => data });
                });
            });
            req.on('error', reject);
            req.end();
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        const user = data.users.find(u => u.email === TEST_USER_EMAIL);

        if (!user) {
            console.log(`❌ User ${TEST_USER_EMAIL} not found`);
            console.log('Available users:', data.users.map(u => u.email).join(', '));
            return null;
        }

        console.log(`✅ Found user: ${user.email}`);
        console.log(`   - Display Name: ${user.display_name || 'Not set'}`);
        console.log(`   - Personal Email: ${user.personal_email || 'Not set'}`);
        console.log(`   - Roles: ${user.roles?.join(', ') || 'None'}`);
        return user;
    } catch (error) {
        console.error('❌ Failed to fetch users:', error.message);
        return null;
    }
}

async function step2_updatePersonalEmail(userId) {
    console.log('\n📝 Step 2: Updating personal email...');
    try {
        const res = await fetch(`${API_BASE}/api/users/update-profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                personal_email: TEST_PERSONAL_EMAIL,
            }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Update failed');
        }

        const data = await res.json();
        console.log(`✅ Personal email updated to: ${TEST_PERSONAL_EMAIL}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to update personal email:', error.message);
        return false;
    }
}

async function step3_verifyUpdate() {
    console.log('\n🔍 Step 3: Verifying update...');
    try {
        const res = await fetch(`${API_BASE}/api/users/list`);
        const data = await res.json();
        const user = data.users.find(u => u.email === TEST_USER_EMAIL);

        if (!user) {
            console.log('❌ User not found after update');
            return null;
        }

        if (user.personal_email === TEST_PERSONAL_EMAIL) {
            console.log(`✅ Personal email verified: ${user.personal_email}`);
            return user;
        } else {
            console.log(`❌ Personal email mismatch:`);
            console.log(`   Expected: ${TEST_PERSONAL_EMAIL}`);
            console.log(`   Got: ${user.personal_email || 'null'}`);
            return null;
        }
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        return null;
    }
}

async function step4_sendTestEmail(user) {
    console.log('\n📧 Step 4: Sending test notification email...');

    const emailToSend = user.personal_email || user.email;
    console.log(`   Target: ${emailToSend}`);

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; 
            padding: 30px; 
            border-radius: 10px 10px 0 0; 
            text-align: center; 
          }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { 
            background: white; 
            padding: 15px; 
            border-left: 4px solid #10b981; 
            margin: 15px 0; 
          }
          .badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 12px;
            margin: 2px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Personal Email Test</h1>
          </div>
          <div class="content">
            <p>Hello ${user.display_name || user.email}!</p>
            
            <p>This is a test email to verify that the personal email system is working correctly.</p>
            
            <div class="info-box">
              <strong>Your Account Details:</strong><br>
              <strong>Login Email:</strong> ${user.email}<br>
              <strong>Personal Email:</strong> ${user.personal_email || 'Not set'}<br>
              <strong>Display Name:</strong> ${user.display_name || 'Not set'}<br>
              <strong>Roles:</strong> ${user.roles?.map(r => `<span class="badge">${r}</span>`).join(' ') || 'None'}
            </div>
            
            <p><strong>How it works:</strong></p>
            <ul>
              <li>You login with: <code>${user.email}</code></li>
              <li>Notifications go to: <code>${emailToSend}</code></li>
              <li>This allows demo @lnc.com emails while using real email for notifications</li>
            </ul>
            
            <p style="color: #10b981; font-weight: bold;">✅ If you received this email, the personal email system is working!</p>
            
            <p>Best regards,<br>LNC Admin Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

    try {
        await gmailTransporter.sendMail({
            from: `LNC Admin Test <${process.env.GMAIL_USER}>`,
            to: emailToSend,
            subject: '✅ Personal Email System Test - LNC Admin',
            html,
        });

        console.log(`✅ Test email sent successfully to ${emailToSend}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send test email:', error.message);
        return false;
    }
}

async function runTest() {
    try {
        // Step 1: Fetch user
        const user = await step1_fetchUser();
        if (!user) {
            console.log('\n❌ Test failed: Could not find user');
            return;
        }

        // Step 2: Update personal email
        const updated = await step2_updatePersonalEmail(user.id);
        if (!updated) {
            console.log('\n❌ Test failed: Could not update personal email');
            return;
        }

        // Step 3: Verify update
        const verifiedUser = await step3_verifyUpdate();
        if (!verifiedUser) {
            console.log('\n❌ Test failed: Could not verify update');
            return;
        }

        // Step 4: Send test email
        const emailSent = await step4_sendTestEmail(verifiedUser);
        if (!emailSent) {
            console.log('\n❌ Test failed: Could not send email');
            return;
        }

        // Success!
        console.log('\n========================================');
        console.log('✅ ALL TESTS PASSED!');
        console.log('========================================');
        console.log('\n📋 Summary:');
        console.log(`   Login Email: ${TEST_USER_EMAIL}`);
        console.log(`   Personal Email: ${TEST_PERSONAL_EMAIL}`);
        console.log(`   Display Name: ${verifiedUser.display_name || 'Not set'}`);
        console.log(`   Roles: ${verifiedUser.roles?.join(', ') || 'None'}`);
        console.log(`\n📬 Check inbox: ${TEST_PERSONAL_EMAIL}`);
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
    }
}

// Run the test
runTest();
