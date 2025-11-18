// Simple email test - hardcoded credentials
// Run: node testing/test-gmail-simple.js

const nodemailer = require('nodemailer');

// IMPORTANT: Replace these with your actual values from .env
const GMAIL_USER = 'latenighthacker6@gmail.com';
const GMAIL_APP_PASSWORD = 'tyhmcxwvoxywbbrv';
const SITE_URL = 'https://lnc-admin-panel.vercel.app/';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
    },
});

console.log('========================================');
console.log('🧪 Testing Gmail SMTP Connection');
console.log(`📧 Sending to: ${GMAIL_USER}`);
console.log('========================================\n');

async function sendAllTestEmails() {
    try {
        // Test 1: Approval Email
        console.log('1️⃣  Sending Registration Approved email...');
        await transporter.sendMail({
            from: `LNC Admin <${GMAIL_USER}>`,
            to: GMAIL_USER,
            subject: '✅ Your LNC Admin Account Has Been Approved! [TEST]',
            html: `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
            <h1>🎉 Account Approved!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px;">
            <p>Hello Test User,</p>
            <p>Your registration for the LNC Admin Panel has been approved.</p>
            <div style="background: white; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0;">
              <strong>Role:</strong> Super Admin<br>
              <strong>Team:</strong> Administration
            </div>
            <div style="text-align: center;">
              <a href="${SITE_URL}/login" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Login Now</a>
            </div>
          </div>
        </div>
      `,
        });
        console.log('   ✅ Sent successfully!\n');

        await new Promise(r => setTimeout(r, 2000));

        // Test 2: Rejection Email
        console.log('2️⃣  Sending Registration Rejected email...');
        await transporter.sendMail({
            from: `LNC Admin <${GMAIL_USER}>`,
            to: GMAIL_USER,
            subject: 'LNC Admin Registration Update [TEST]',
            html: `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center;">
            <h1>Registration Update</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px;">
            <p>Hello Test User,</p>
            <p>Your registration request has not been approved.</p>
            <div style="background: white; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0;">
              <strong>Reason:</strong> Test rejection email
            </div>
          </div>
        </div>
      `,
        });
        console.log('   ✅ Sent successfully!\n');

        await new Promise(r => setTimeout(r, 2000));

        // Test 3: Role Changed Email
        console.log('3️⃣  Sending Role Changed email...');
        await transporter.sendMail({
            from: `LNC Admin <${GMAIL_USER}>`,
            to: GMAIL_USER,
            subject: '🔄 Your LNC Admin Roles Have Been Updated [TEST]',
            html: `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1>🔄 Roles Updated</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px;">
            <p>Hello Test User,</p>
            <p>Your roles have been updated.</p>
            <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0;">
              <strong>Current Roles:</strong><br>
              <span style="background: #667eea; color: white; padding: 5px 10px; border-radius: 15px; margin: 5px;">Super Admin</span>
              <span style="background: #667eea; color: white; padding: 5px 10px; border-radius: 15px; margin: 5px;">Social Media Team Admin</span>
            </div>
          </div>
        </div>
      `,
        });
        console.log('   ✅ Sent successfully!\n');

        await new Promise(r => setTimeout(r, 2000));

        // Test 4: New Group Notification
        console.log('4️⃣  Sending New Group Notification...');
        await transporter.sendMail({
            from: `LNC Admin <${GMAIL_USER}>`,
            to: GMAIL_USER,
            subject: "You've been added to Test Project Group [TEST]",
            html: `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1>💬 New Group!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px;">
            <p>You've been added to a chat group:</p>
            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h2 style="color: #667eea; margin-top: 0;">Test Project Group</h2>
              <p>Project collaboration and updates</p>
            </div>
            <div style="text-align: center;">
              <a href="${SITE_URL}/dashboard?tab=chat" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">View Group</a>
            </div>
          </div>
        </div>
      `,
        });
        console.log('   ✅ Sent successfully!\n');

        await new Promise(r => setTimeout(r, 2000));

        // Test 5: New Message Notification
        console.log('5️⃣  Sending New Message Notification...');
        await transporter.sendMail({
            from: `LNC Admin <${GMAIL_USER}>`,
            to: GMAIL_USER,
            subject: 'New message in Test Project Group [TEST]',
            html: `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
            <h1>💬 New Message!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px;">
            <p>New message in <strong>Test Project Group</strong>:</p>
            <div style="background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
              <div style="color: #666; font-size: 14px; margin-bottom: 10px;">
                <strong>From:</strong> admin@example.com
              </div>
              <p>This is a test message to check the email notification system!</p>
            </div>
            <div style="text-align: center;">
              <a href="${SITE_URL}/dashboard?tab=chat" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">View Message</a>
            </div>
          </div>
        </div>
      `,
        });
        console.log('   ✅ Sent successfully!\n');

        console.log('========================================');
        console.log('✅ ALL 5 EMAILS SENT SUCCESSFULLY!');
        console.log(`📬 Check your inbox: ${GMAIL_USER}`);
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nPlease check:');
        console.error('1. Gmail credentials are correct');
        console.error('2. App password is valid (not regular password)');
        console.error('3. Gmail account allows less secure apps\n');
    }
}

sendAllTestEmails();
