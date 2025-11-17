// Email service using Gmail SMTP
import nodemailer from 'nodemailer';

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send registration approved email
 */
export async function sendRegistrationApprovedEmail(
  email: string,
  name: string,
  role: string,
  team: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 Attempting to send approval email to: ${email}`);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .info-box {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .info-box h3 {
      margin-top: 0;
      color: #10b981;
    }
    .info-box p {
      margin: 8px 0;
    }
    .button {
      display: inline-block;
      background: #10b981;
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: bold;
      text-align: center;
    }
    .button:hover {
      background: #059669;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Account Approved!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${name}</strong>,</p>
      
      <p>Great news! Your registration for the LNC Admin Panel has been <strong>approved</strong> by our administrator.</p>
      
      <div class="info-box">
        <h3>📋 Your Account Details</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> <span class="badge">${role}</span></p>
        <p><strong>Team:</strong> ${team}</p>
      </div>
      
      <p>You can now log in to the admin panel using the credentials you provided during registration.</p>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login" class="button">
          🚀 Login to Dashboard
        </a>
      </div>
      
      <p style="font-size: 12px; color: #6b7280; text-align: center;">
        If the button doesn't work, copy and paste this link:<br>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login">${process.env.NEXT_PUBLIC_SITE_URL}/login</a>
      </p>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      
      <p><strong>Welcome to the team! 🎊</strong></p>
      
      <p>Best regards,<br><strong>LNC Admin Team</strong></p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from LNC Admin Panel</p>
      <p>© ${new Date().getFullYear()} Late Night Coders. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'LNC Admin'}" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🎉 Your LNC Admin Account Has Been Approved!',
      html: html,
    });

    console.log(`✅ Approval email sent successfully! Message ID: ${info.messageId}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send approval email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send registration rejected email
 */
export async function sendRegistrationRejectedEmail(
  email: string,
  name: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 Attempting to send rejection email to: ${email}`);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .info-box {
      background: #fef2f2;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #ef4444;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .info-box h3 {
      margin-top: 0;
      color: #ef4444;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Registration Update</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${name}</strong>,</p>
      
      <p>Thank you for your interest in joining the LNC Admin Panel.</p>
      
      <p>We regret to inform you that your registration request has <strong>not been approved</strong> at this time.</p>
      
      ${reason ? `
      <div class="info-box">
        <h3>📝 Reason</h3>
        <p>${reason}</p>
      </div>
      ` : ''}
      
      <p>If you believe this is an error or would like to discuss this further, please contact our support team.</p>
      
      <p>We appreciate your understanding.</p>
      
      <p>Best regards,<br><strong>LNC Admin Team</strong></p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from LNC Admin Panel</p>
      <p>© ${new Date().getFullYear()} Late Night Coders. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'LNC Admin'}" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'LNC Admin Registration Update',
      html: html,
    });

    console.log(`✅ Rejection email sent successfully! Message ID: ${info.messageId}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send rejection email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email to new users created directly by admin
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 Attempting to send welcome email to: ${email}`);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .info-box {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>👋 Welcome!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${name}</strong>,</p>
      
      <p>Your account has been created for the LNC Admin Panel!</p>
      
      <div class="info-box">
        <h3>📋 Account Information</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> <span class="badge">${role}</span></p>
      </div>
      
      <p>You can now log in to access the admin panel.</p>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login" class="button">
          🚀 Login to Dashboard
        </a>
      </div>
      
      <p style="font-size: 12px; color: #6b7280; text-align: center;">
        If the button doesn't work, copy and paste this link:<br>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login">${process.env.NEXT_PUBLIC_SITE_URL}/login</a>
      </p>
      
      <p>If you have any questions, feel free to reach out to our support team.</p>
      
      <p>Best regards,<br><strong>LNC Admin Team</strong></p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from LNC Admin Panel</p>
      <p>© ${new Date().getFullYear()} Late Night Coders. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'LNC Admin'}" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '👋 Welcome to LNC Admin Panel!',
      html: html,
    });

    console.log(`✅ Welcome email sent successfully! Message ID: ${info.messageId}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
}
