import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTemplateEmail } from "@/lib/email-service";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Assign users to a ticket
export async function POST(request: NextRequest) {
  try {
    const { ticket_id, user_ids, assigned_by } = await request.json();

    if (!ticket_id || !user_ids || !Array.isArray(user_ids) || !assigned_by) {
      return NextResponse.json(
        { error: "Ticket ID, user IDs array, and assigner are required" },
        { status: 400 }
      );
    }

    // Create assignments for each user
    const assignments = user_ids.map((user_id) => ({
      ticket_id,
      user_id,
      assigned_by,
    }));

    const { data, error } = await supabase
      .from("ticket_assignments")
      .upsert(assignments, { onConflict: "ticket_id,user_id" })
      .select();

    if (error) {
      console.error("Assign ticket error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get ticket details for email
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id, title, description, priority, status, issue_number")
      .eq("id", ticket_id)
      .single();

    // Get assigned users details including personal_email
    const { data: assignedUsers, error: usersError } = await supabase
      .from("users")
      .select("id, email, display_name, personal_email")
      .in("id", user_ids);

    // Get assigner details
    const { data: assigner, error: assignerError } = await supabase
      .from("users")
      .select("display_name, email")
      .eq("id", assigned_by)
      .single();

    // Send email notifications to assigned users
    if (ticket && assignedUsers && !ticketError && !usersError) {
      const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?ticket=${ticket.id}`;
      const assignerName = assigner?.display_name || assigner?.email || "Admin";

      for (const user of assignedUsers) {
        // Use personal_email if available, otherwise use work email
        const recipientEmail = user.personal_email || user.email;
        const recipientName = user.display_name || user.email;

        try {
          await sendTemplateEmail(
            "ticket_assigned",
            recipientEmail,
            {
              assigneeName: recipientName,
              userName: recipientName,
              ticketNumber: ticket.issue_number?.toString() || ticket.id.substring(0, 8),
              ticketTitle: ticket.title,
              ticketDescription: ticket.description,
              description: ticket.description,
              priority: ticket.priority,
              priorityColor: ticket.priority === 'high' ? '#dc2626' : ticket.priority === 'medium' ? '#f59e0b' : '#10b981',
              status: ticket.status,
              assignedBy: assignerName,
              ticketUrl: ticketUrl,
            },
            {
              toName: recipientName,
            }
          );
          console.log(`Assignment email sent to ${recipientEmail} for ticket #${ticket.issue_number}`);
        } catch (emailError) {
          console.error(`Failed to send assignment email to ${recipientEmail}:`, emailError);
          // Don't fail the assignment if email fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      assignments: data,
    });
  } catch (error) {
    console.error("Assign ticket error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove assignment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignment_id");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("ticket_assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      console.error("Remove assignment error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Assignment removed successfully",
    });
  } catch (error) {
    console.error("Remove assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
