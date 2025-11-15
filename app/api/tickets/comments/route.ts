import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch comments for a ticket
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticket_id");

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const { data: comments, error } = await supabase
      .from("ticket_comments")
      .select(`
        *,
        user:users(id, email, display_name)
      `)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fetch comments error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a comment to a ticket
export async function POST(request: NextRequest) {
  try {
    const { ticket_id, user_id, comment } = await request.json();

    if (!ticket_id || !user_id || !comment) {
      return NextResponse.json(
        { error: "Ticket ID, user ID, and comment are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ticket_comments")
      .insert({
        ticket_id,
        user_id,
        comment,
      })
      .select(`
        *,
        user:users(id, email, display_name)
      `)
      .single();

    if (error) {
      console.error("Add comment error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comment: data,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
