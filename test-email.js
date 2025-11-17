// Test email sending with Resend
import { Resend } from 'resend';

const resend = new Resend('re_5mNLePeZ_GoWiuYHeK1d1tkbxiDrTjpxZ');

async function testEmail() {
    try {
        console.log('🚀 Sending test email...');

        const { data, error } = await resend.emails.send({
            from: 'LNC Admin <onboarding@resend.dev>',
            to: ['latenightcoders1@gmail.com'],
            subject: '✅ Test Email from LNC Admin Panel',
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .badge {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                margin: 10px 0;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Email System Test</h1>
              </div>
              <div class="content">
                <p>Hello from LNC Admin Panel!</p>
                
                <div class="badge">✅ Email System Working</div>
                
                <p>This is a test email to verify that your email notification system is working correctly.</p>
                
                <h3>📧 Email System Details:</h3>
                <ul>
                  <li><strong>Service:</strong> Resend</li>
                  <li><strong>From:</strong> onboarding@resend.dev</li>
                  <li><strong>Status:</strong> Active ✅</li>
                </ul>
                
                <p>Your LNC Admin Panel is now ready to send automated notifications for:</p>
                <ul>
                  <li>🎊 Welcome emails for new users</li>
                  <li>✅ Registration approval notifications</li>
                  <li>❌ Registration rejection notifications</li>
                  <li>🔄 Role change updates</li>
                  <li>🎫 Ticket assignments</li>
                </ul>
                
                <p><strong>Next steps:</strong></p>
                <ol>
                  <li>Execute <code>setup-email-system.sql</code> in Supabase</li>
                  <li>Update CRON_SECRET in .env file</li>
                  <li>Test by creating a new user</li>
                </ol>
                
                <div class="footer">
                  <p>This is an automated test message from LNC Admin Panel</p>
                  <p>Generated on ${new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
        });

        if (error) {
            console.error('❌ Error sending email:', error);
            return;
        }

        console.log('✅ Email sent successfully!');
        console.log('📧 Email ID:', data.id);
        console.log('📬 Check your inbox at: latenightcoders1@gmail.com');
        console.log('\n🎉 Your email system is working perfectly!\n');
    } catch (error) {
        console.error('❌ Failed to send test email:', error);
    }
}

testEmail();
