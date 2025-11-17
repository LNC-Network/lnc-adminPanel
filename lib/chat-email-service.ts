import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface NewGroupEmailParams {
  recipientEmail: string;
  recipientName: string;
  groupName: string;
  groupDescription?: string;
  createdBy: string;
}

interface NewMessageEmailParams {
  recipientEmail: string;
  recipientName: string;
  groupName: string;
  senderEmail: string;
  message: string;
}

export async function sendNewGroupNotification({
  recipientEmail,
  recipientName,
  groupName,
  groupDescription,
  createdBy,
}: NewGroupEmailParams) {
  const subject = `You've been added to ${groupName}`;
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
          <h1>🎉 New Group Invitation</h1>
        </div>
        <div class="content">
          <p>Hi ${recipientName},</p>
          <p>You've been added to a new chat group!</p>
          
          <div class="group-info">
            <h2 style="margin-top: 0;">📢 ${groupName}</h2>
            ${groupDescription ? `<p><strong>Description:</strong> ${groupDescription}</p>` : ''}
            <p><strong>Created by:</strong> ${createdBy}</p>
          </div>
          
          <p>Login to the admin panel to start chatting with your team members.</p>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" class="button">
            Open Chat
          </a>
          
          <div class="footer">
            <p>This is an automated message from LNC Admin Panel</p>
            <p>Late Night Coders Network</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"LNC Admin Panel" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject,
      html,
    });
    console.log(`New group notification sent to ${recipientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending new group notification:', error);
    return { success: false, error };
  }
}

export async function sendNewMessageNotification({
  recipientEmail,
  recipientName,
  groupName,
  senderEmail,
  message,
}: NewMessageEmailParams) {
  const subject = `New message in ${groupName}`;
  const truncatedMessage = message.length > 100 ? message.substring(0, 100) + '...' : message;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .message-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
        .sender { color: #667eea; font-weight: bold; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 New Message</h1>
        </div>
        <div class="content">
          <p>Hi ${recipientName},</p>
          <p>You have a new message in <strong>${groupName}</strong>:</p>
          
          <div class="message-box">
            <p class="sender">${senderEmail}</p>
            <p>${truncatedMessage}</p>
          </div>
          
          <p>Login to view the full conversation and reply.</p>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" class="button">
            View Message
          </a>
          
          <div class="footer">
            <p>This is an automated message from LNC Admin Panel</p>
            <p>Late Night Coders Network</p>
            <p style="font-size: 10px; margin-top: 10px;">To reduce email notifications, consider using the chat application directly.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"LNC Admin Panel" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject,
      html,
    });
    console.log(`New message notification sent to ${recipientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending new message notification:', error);
    return { success: false, error };
  }
}
