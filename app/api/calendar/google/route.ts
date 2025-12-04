import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Helper to refresh access token
async function refreshAccessToken(userId: string, refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokens = await response.json();

    if (tokens.error) {
      console.error("Token refresh error:", tokens);
      return null;
    }

    // Update tokens in database
    await supabase
      .from("google_calendar_tokens")
      .update({
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return tokens.access_token;
  } catch (error) {
    console.error("Refresh token error:", error);
    return null;
  }
}

// Get valid access token
async function getValidAccessToken(userId: string): Promise<string | null> {
  const { data: tokenData, error } = await supabase
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !tokenData) {
    return null;
  }

  // Check if token is expired (with 5 min buffer)
  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000;

  if (expiresAt.getTime() - bufferMs < now.getTime()) {
    // Token expired, refresh it
    return refreshAccessToken(userId, tokenData.refresh_token);
  }

  return tokenData.access_token;
}

// GET - Fetch Google Calendar events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const timeMin = searchParams.get("timeMin"); // ISO date string
    const timeMax = searchParams.get("timeMax"); // ISO date string

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
      return NextResponse.json({ connected: false, events: [] });
    }

    // Fetch events from Google Calendar
    const calendarUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    calendarUrl.searchParams.set("singleEvents", "true");
    calendarUrl.searchParams.set("orderBy", "startTime");
    calendarUrl.searchParams.set("maxResults", "250");
    
    if (timeMin) calendarUrl.searchParams.set("timeMin", timeMin);
    if (timeMax) calendarUrl.searchParams.set("timeMax", timeMax);

    const response = await fetch(calendarUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token invalid, delete it
        await supabase
          .from("google_calendar_tokens")
          .delete()
          .eq("user_id", userId);
        return NextResponse.json({ connected: false, events: [] });
      }
      throw new Error("Failed to fetch Google Calendar events");
    }

    const data = await response.json();

    // Transform Google Calendar events to our format
    const events = (data.items || []).map((item: any) => ({
      id: `google_${item.id}`,
      title: item.summary || "No Title",
      description: item.description || "",
      date: item.start?.date || item.start?.dateTime?.split("T")[0],
      time: item.start?.dateTime ? item.start.dateTime.split("T")[1].substring(0, 5) : null,
      color: "bg-sky-500", // Google events are sky blue
      isGoogleEvent: true,
      googleEventId: item.id,
      htmlLink: item.htmlLink,
    }));

    return NextResponse.json({ connected: true, events });
  } catch (error) {
    console.error("Google Calendar fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST - Create event in Google Calendar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, date, time, allDay } = body;

    if (!userId || !title || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
      return NextResponse.json({ error: "Google Calendar not connected" }, { status: 401 });
    }

    // Build event object
    const event: any = {
      summary: title,
      description: description || "",
    };

    if (allDay || !time) {
      event.start = { date };
      event.end = { date };
    } else {
      const startDateTime = `${date}T${time}:00`;
      const endDateTime = `${date}T${time.split(":")[0]}:59:00`; // 1 hour later
      event.start = { dateTime: startDateTime, timeZone: "UTC" };
      event.end = { dateTime: endDateTime, timeZone: "UTC" };
    }

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Google Calendar create error:", error);
      return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }

    const createdEvent = await response.json();

    return NextResponse.json({
      success: true,
      event: {
        id: `google_${createdEvent.id}`,
        googleEventId: createdEvent.id,
        htmlLink: createdEvent.htmlLink,
      },
    });
  } catch (error) {
    console.error("Google Calendar create error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

// DELETE - Delete event from Google Calendar
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const eventId = searchParams.get("eventId");

    if (!userId || !eventId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
      return NextResponse.json({ error: "Google Calendar not connected" }, { status: 401 });
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      console.error("Google Calendar delete error:", error);
      return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google Calendar delete error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}

// Check connection status
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new NextResponse(null, { status: 400 });
    }

    const { data } = await supabase
      .from("google_calendar_tokens")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    return new NextResponse(null, { status: data ? 200 : 404 });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
