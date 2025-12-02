import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch user's events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { data: events, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ events: events || [] });
  } catch (error: any) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, date, time, color } = body;

    if (!userId || !title || !date) {
      return NextResponse.json(
        { error: "User ID, title, and date are required" },
        { status: 400 }
      );
    }

    const { data: event, error } = await supabase
      .from("calendar_events")
      .insert({
        user_id: userId,
        title,
        description: description || null,
        date,
        time: time || null,
        color: color || "bg-blue-500",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
      { status: 500 }
    );
  }
}

// PATCH - Update event
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, userId, title, description, date, time, color } = body;

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: "Event ID and User ID are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("calendar_events")
      .select("user_id")
      .eq("id", eventId)
      .single();

    if (fetchError) throw fetchError;

    if (existing.user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to update this event" },
        { status: 403 }
      );
    }

    const { data: event, error } = await supabase
      .from("calendar_events")
      .update({
        title,
        description: description || null,
        date,
        time: time || null,
        color,
      })
      .eq("id", eventId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ event });
  } catch (error: any) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE - Delete event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const userId = searchParams.get("userId");

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: "Event ID and User ID are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("calendar_events")
      .select("user_id")
      .eq("id", eventId)
      .single();

    if (fetchError) throw fetchError;

    if (existing.user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this event" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete event" },
      { status: 500 }
    );
  }
}
