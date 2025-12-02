import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email-service";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient, recipientType, subject, body: emailBody, scheduledAt } = body;

    if (!subject || !emailBody) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      );
    }

    let recipients: string[] = [];

    // Determine recipients based on type
    if (recipientType === "single") {
      if (!recipient) {
        return NextResponse.json(
          { error: "Recipient email is required" },
          { status: 400 }
        );
      }
      recipients = [recipient];
    } else if (recipientType === "all") {
      // Get all users
      const { data: users } = await supabase
        .from("users")
        .select("email")
        .not("email", "is", null);
      recipients = users?.map(u => u.email) || [];
    } else if (recipientType === "role") {
      if (!recipient) {
        return NextResponse.json(
          { error: "Role name is required" },
          { status: 400 }
        );
      }
      // Get users by role
      const { data: roleData } = await supabase
        .from("roles")
        .select("id")
        .eq("name", recipient)
        .single();

      if (roleData) {
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("users(email)")
          .eq("role_id", roleData.id);

        recipients = userRoles?.map((ur: any) => ur.users?.email).filter(Boolean) || [];
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found" },
        { status: 400 }
      );
    }

    const scheduled = scheduledAt ? new Date(scheduledAt) : new Date();
    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

    // Add emails to queue
    const queueItems = recipients.map(email => ({
      recipient: email,
      subject,
      body: emailBody,
      status: isScheduled ? "pending" : "pending",
      scheduled_at: scheduled.toISOString(),
    }));

    const { error: queueError } = await supabase
      .from("email_queue")
      .insert(queueItems);

    if (queueError) throw queueError;

    // If not scheduled, send immediately
    if (!isScheduled) {
      for (const email of recipients) {
        try {
          await sendEmail({
            to: email,
            subject,
            html: emailBody.replace(/\n/g, "<br>"),
            text: emailBody,
          });

          // Update status to sent
          await supabase
            .from("email_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("recipient", email)
            .eq("subject", subject)
            .eq("status", "pending");
        } catch (error: any) {
          // Update status to failed
          await supabase
            .from("email_queue")
            .update({
              status: "failed",
              error_message: error.message,
            })
            .eq("recipient", email)
            .eq("subject", subject)
            .eq("status", "pending");
        }
      }
    }

    return NextResponse.json({
      success: true,
      recipientCount: recipients.length,
      scheduled: isScheduled,
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
