import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all tickets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assigned_to");

    let query = supabase
      .from("tickets")
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, email, display_name),
        ticket_assignments(
          id,
          assigned_user:users!ticket_assignments_user_id_fkey(id, email, display_name)
        )
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.error("Fetch tickets error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Filter by assigned user if specified
    let filteredTickets = tickets;
    if (assignedTo) {
      filteredTickets = tickets.filter((ticket: any) =>
        ticket.ticket_assignments?.some((assignment: any) => 
          assignment.assigned_user?.id === assignedTo
        )
      );
    }

    return NextResponse.json({ tickets: filteredTickets });
  } catch (error) {
    console.error("Get tickets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const { title, description, priority, created_by } = await request.json();

    if (!title || !description || !created_by) {
      return NextResponse.json(
        { error: "Title, description, and creator are required" },
        { status: 400 }
      );
    }

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        title,
        description,
        priority: priority || "medium",
        status: "open",
        created_by,
      })
      .select()
      .single();

    if (error) {
      console.error("Create ticket error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update ticket status or details
export async function PATCH(request: NextRequest) {
  try {
    const { ticket_id, status, priority, title, description } = await request.json();

    if (!ticket_id) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const updates: any = { updated_at: new Date().toISOString() };
    
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (title) updates.title = title;
    if (description) updates.description = description;
    
    if (status === "closed" || status === "resolved") {
      updates.closed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("tickets")
      .update(updates)
      .eq("id", ticket_id)
      .select()
      .single();

    if (error) {
      console.error("Update ticket error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket: data,
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a ticket
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticket_id");

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("tickets")
      .delete()
      .eq("id", ticketId);

    if (error) {
      console.error("Delete ticket error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Delete ticket error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
