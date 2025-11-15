import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
