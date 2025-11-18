// Test all email functions with Gmail SMTP
// Run: node testing/test-all-emails.js

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envFiles = ['.env.local', '.env'];
let envLoaded = false;

for (const envFile of envFiles) {
    const envPath = path.join(__dirname, '..', envFile);
    if (fs.existsSync(envPath)) {
        console.log(`Reading ${envFile}...`);
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach((line, index) => {
            // Skip comments and empty lines
            if (line.trim().startsWith('#') || !line.trim()) return;

            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();

                // Remove inline comments
                const commentIndex = value.indexOf('//');
                if (commentIndex !== -1) {
                    value = value.substring(0, commentIndex).trim();
                }

                // Remove quotes
                value = value.replace(/^["']|["']$/g, '');

                if (key === 'GMAIL_USER' || key === 'GMAIL_APP_PASSWORD') {
                    console.log(`Found ${key} = ${value.substring(0, 10)}...`);
                }

                // Always set the value (override if it exists)
                process.env[key] = value;
            }
        });
        envLoaded = true;
        console.log(`✅ Loaded environment from ${envFile}`);
        break;
    }
}

// Check if credentials are loaded
console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '***' + process.env.GMAIL_APP_PASSWORD.slice(-4) : 'undefined');

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('❌ ERROR: Gmail credentials not found!');
    console.error('Please make sure .env.local has:');
    console.error('  GMAIL_USER=your-email@gmail.com');
    console.error('  GMAIL_APP_PASSWORD=your-app-password');
    process.exit(1);
}

// Gmail SMTP transporter
const gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

const TEST_EMAIL = process.env.GMAIL_USER; // Send to yourself for testing
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Test 1: Registration Approved Email
async function testApprovalEmail() {
    console.log('\n📧 Testing Registration Approved Email...');

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin: 10px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Account Approved!</h1>
          </div>
          <div class="content">
            <p>Hello Test User,</p>
            
            <p>Great news! Your registration for the LNC Admin Panel has been approved.</p>
            
            <div class="info-box">
              <strong>Account Details:</strong><br>
              <strong>Email:</strong> ${TEST_EMAIL}<br>
              <strong>Role:</strong> <span class="badge">Super Admin</span><br>
              <strong>Team:</strong> Administration
            </div>
            
            <p>You can now log in to the LNC Admin Panel using your credentials.</p>
            
            <div style="text-align: center;">
              <a href="${SITE_URL}/login" class="button">Login Now</a>
            </div>
            
            <p><small>If the button doesn't work, copy and paste this link into your browser:<br>
            ${SITE_URL}/login</small></p>
            
            <p>If you have any questions, please contact your administrator.</p>
            
            <p>Best regards,<br>LNC Admin Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

    try {
        await gmailTransporter.sendMail({
            from: `LNC Admin <${process.env.GMAIL_USER}>`,
            to: TEST_EMAIL,
            subject: '✅ Your LNC Admin Account Has Been Approved!',
            html,
        });
        console.log('✅ Registration Approved email sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send approval email:', error.message);
    }
}

// Test 2: Registration Rejected Email
async function testRejectionEmail() {
    console.log('\n📧 Testing Registration Rejected Email...');

    const reason = 'Your email domain is not authorized for admin access.';
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Registration Update</h1>
          </div>
          <div class="content">
            <p>Hello Test User,</p>
            
            <p>Thank you for your interest in the LNC Admin Panel.</p>
            
            <p>Unfortunately, your registration request has not been approved at this time.</p>
            
            <div class="info-box">
              <strong>Reason:</strong><br>
              ${reason}
            </div>
            
            <p>If you believe this was an error or have questions, please contact your administrator.</p>
            
            <p>Best regards,<br>LNC Admin Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

    try {
        await gmailTransporter.sendMail({
            from: `LNC Admin <${process.env.GMAIL_USER}>`,
            to: TEST_EMAIL,
            subject: 'LNC Admin Registration Update',
            html,
        });
        console.log('✅ Registration Rejected email sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send rejection email:', error.message);
    }
}

// Test 3: Role Changed Email
async function testRoleChangedEmail() {
    console.log('\n📧 Testing Role Changed Email...');

    const roles = ['Super Admin', 'Social Media Team Admin', 'Design Team Member'];
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .role-badge { display: inline-block; background: #667eea; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin: 5px; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Your Roles Have Been Updated</h1>
          </div>
          <div class="content">
            <p>Hello Test User,</p>
            
            <p>Your roles in the LNC Admin Panel have been updated.</p>
            
            <div class="info-box">
              <strong>Your Current Roles:</strong><br>
              ${roles.map(role => `<span class="role-badge">${role}</span>`).join(' ')}
            </div>
            
            <p>These changes are effective immediately. Your access permissions have been updated accordingly.</p>
            
            <div style="text-align: center;">
              <a href="${SITE_URL}/login" class="button">Go to Dashboard</a>
            </div>
            
            <p>If you have any questions about your new roles, please contact your administrator.</p>
            
            <p>Best regards,<br>LNC Admin Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

    try {
        await gmailTransporter.sendMail({
            from: `LNC Admin <${process.env.GMAIL_USER}>`,
            to: TEST_EMAIL,
            subject: '🔄 Your LNC Admin Roles Have Been Updated',
            html,
        });
        console.log('✅ Role Changed email sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send role changed email:', error.message);
    }
}

// Test 4: New Group Notification
async function testNewGroupEmail() {
    console.log('\n📧 Testing New Group Notification Email...');

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .group-info { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 You've Been Added to a Group!</h1>
          </div>
          <div class="content">
            <p>Hello Test User,</p>
            <p>You've been added to a new chat group in the LNC Admin Panel.</p>
            
            <div class="group-info">
              <h2 style="margin-top: 0; color: #667eea;">Test Project Group</h2>
              <p style="color: #666;">This is a test group for project collaboration and updates.</p>
              <p style="margin-bottom: 0;"><strong>Created by:</strong> admin@example.com</p>
            </div>
            
            <p>Click the button below to view the group and start chatting:</p>
            
            <div style="text-align: center;">
              <a href="${SITE_URL}/dashboard?tab=chat" class="button">View Group</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              You'll receive notifications when new messages are posted in this group.
            </p>
            
            <div class="footer">
              <p>This is an automated message from LNC Admin Panel</p>
              <p>&copy; 2024 Late Night Coders. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

    try {
        await gmailTransporter.sendMail({
            from: `LNC Admin <${process.env.GMAIL_USER}>`,
            to: TEST_EMAIL,
            subject: "You've been added to Test Project Group",
            html,
        });
        console.log('✅ New Group Notification email sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send new group email:', error.message);
    }
}

// Test 5: New Message Notification
async function testNewMessageEmail() {
    console.log('\n📧 Testing New Message Notification Email...');

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px; }
          .sender-info { color: #666; font-size: 14px; margin-bottom: 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Message in Test Project Group</h1>
          </div>
          <div class="content">
            <p>Hello Test User,</p>
            <p>You have a new message in <strong>Test Project Group</strong>:</p>
            
            <div class="message-box">
              <div class="sender-info">
                <strong>From:</strong> admin@example.com
              </div>
              <p style="margin: 0; color: #333;">
                Hey everyone! This is a test message to demonstrate the email notification system. Please check the dashboard for more details.
              </p>
            </div>
            
            <p>Click the button below to view the conversation:</p>
            
            <div style="text-align: center;">
              <a href="${SITE_URL}/dashboard?tab=chat" class="button">View Message</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              To manage your notification preferences, visit your dashboard settings.
            </p>
            
            <div class="footer">
              <p>This is an automated message from LNC Admin Panel</p>
              <p>&copy; 2024 Late Night Coders. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

    try {
        await gmailTransporter.sendMail({
            from: `LNC Admin <${process.env.GMAIL_USER}>`,
            to: TEST_EMAIL,
            subject: 'New message in Test Project Group',
            html,
        });
        console.log('✅ New Message Notification email sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send new message email:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('========================================');
    console.log('🧪 Testing All Email Functions');
    console.log('========================================');
    console.log(`Sending all test emails to: ${TEST_EMAIL}`);
    console.log('========================================');

    await testApprovalEmail();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between emails

    await testRejectionEmail();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await testRoleChangedEmail();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await testNewGroupEmail();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await testNewMessageEmail();

    console.log('\n========================================');
    console.log('✅ All email tests completed!');
    console.log(`📬 Check your inbox: ${TEST_EMAIL}`);
    console.log('========================================\n');
}

// Run the tests
runAllTests().catch(console.error);
