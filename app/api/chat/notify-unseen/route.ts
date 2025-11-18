import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTemplateEmail } from "@/lib/email-service";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Send email notifications for unseen messages older than 12 hours
// This should be called by a cron job (e.g., every hour)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all unseen messages older than 12 hours
    const { data: unseenMessages, error } = await supabase.rpc(
      "get_unseen_messages_older_than",
      { p_hours: 12 }
    );

    if (error) {
      console.error("Error fetching unseen messages:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!unseenMessages || unseenMessages.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No unseen messages to notify",
        notifications_sent: 0,
      });
    }

    // Group messages by user and group
    const userGroupMessages = unseenMessages.reduce((acc: any, msg: any) => {
      const key = `${msg.user_id}:${msg.group_id}`;
      if (!acc[key]) {
        acc[key] = {
          user_id: msg.user_id,
          user_email: msg.user_email,
          personal_email: msg.personal_email,
          group_id: msg.group_id,
          group_name: msg.group_name,
          messages: [],
        };
      }
      acc[key].messages.push({
        id: msg.message_id,
        text: msg.message_text,
        sender: msg.sender_email,
        created_at: msg.message_created_at,
        hours_unseen: Math.floor(msg.hours_unseen),
      });
      return acc;
    }, {});

    let notificationsSent = 0;
    const emailPromises = [];

    // Send email for each user-group combination
    for (const key in userGroupMessages) {
      const data = userGroupMessages[key];
      const recipientEmail = data.personal_email || data.user_email;
      const messageCount = data.messages.length;

      // Prepare message list for email
      const messageList = data.messages
        .slice(0, 5) // Show max 5 messages in email
        .map((msg: any) => {
          const preview = msg.text.length > 100 
            ? msg.text.substring(0, 100) + "..." 
            : msg.text;
          return `${msg.sender}: ${preview}`;
        });

      const hasMore = messageCount > 5;

      try {
        emailPromises.push(
          sendTemplateEmail(
            "chat_unseen_messages",
            recipientEmail,
            {
              userName: data.user_email.split("@")[0],
              groupName: data.group_name,
              messageCount: messageCount.toString(),
              messageList: messageList,
              hasMore: hasMore.toString(),
              moreCount: hasMore ? (messageCount - 5).toString() : "0",
              chatUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?chat=true&group=${data.group_id}`,
            },
            {
              toName: data.user_email.split("@")[0],
            }
          ).then(async (result) => {
            if (result.success) {
              // Record that we sent notifications for these messages
              const notificationRecords = data.messages.map((msg: any) => ({
                user_id: data.user_id,
                group_id: data.group_id,
                message_id: msg.id,
              }));

              await supabase
                .from("chat_unseen_notifications")
                .insert(notificationRecords);

              notificationsSent++;
              console.log(`Unseen message email sent to ${recipientEmail} for group ${data.group_name}`);
            } else {
              console.error(`Failed to send email to ${recipientEmail}:`, result.error);
            }
          })
        );
      } catch (emailError) {
        console.error(`Error sending email to ${recipientEmail}:`, emailError);
      }
    }

    // Wait for all emails to be sent
    await Promise.allSettled(emailPromises);

    return NextResponse.json({
      success: true,
      message: `Processed ${unseenMessages.length} unseen messages`,
      notifications_sent: notificationsSent,
      users_notified: Object.keys(userGroupMessages).length,
    });
  } catch (error) {
    console.error("Error in unseen notifications cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Check unseen messages that would trigger notifications (for testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get("hours") || "12");

    const { data: unseenMessages, error } = await supabase.rpc(
      "get_unseen_messages_older_than",
      { p_hours: hours }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Group by user
    const byUser = (unseenMessages || []).reduce((acc: any, msg: any) => {
      if (!acc[msg.user_email]) {
        acc[msg.user_email] = {
          email: msg.user_email,
          groups: {},
        };
      }
      if (!acc[msg.user_email].groups[msg.group_name]) {
        acc[msg.user_email].groups[msg.group_name] = [];
      }
      acc[msg.user_email].groups[msg.group_name].push({
        message: msg.message_text.substring(0, 50),
        hours_ago: Math.floor(msg.hours_unseen),
      });
      return acc;
    }, {});

    return NextResponse.json({
      total_messages: unseenMessages?.length || 0,
      users: Object.values(byUser),
      hours_threshold: hours,
    });
  } catch (error) {
    console.error("Error in GET unseen notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
