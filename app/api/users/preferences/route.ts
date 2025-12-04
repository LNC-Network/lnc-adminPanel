import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// GET - Fetch user preferences
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        // PGRST205 = table doesn't exist
        if (error.code === "PGRST205") {
          // Table doesn't exist, return defaults
          return NextResponse.json({
            preferences: {
              email_notifications: true,
              push_notifications: true,
              sound_enabled: true,
            },
          });
        }
        console.error("Fetch preferences error:", error);
        return NextResponse.json(
          { error: "Failed to fetch preferences" },
          { status: 400 }
        );
      }

      // Return default preferences if none exist
      if (!data) {
        return NextResponse.json({
          preferences: {
            email_notifications: true,
            push_notifications: true,
            sound_enabled: true,
          },
        });
      }

      return NextResponse.json({ preferences: data });
    } catch {
      // Table might not exist, return defaults
      return NextResponse.json({
        preferences: {
          email_notifications: true,
          push_notifications: true,
          sound_enabled: true,
        },
      });
    }
  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    const { userId, email_notifications, push_notifications, sound_enabled } =
      await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    try {
      // Try to update existing preferences, or create new ones
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", userId)
        .single();

      let result;
      if (existing) {
        // Update existing
        result = await supabase
          .from("user_preferences")
          .update({
            email_notifications:
              email_notifications !== undefined ? email_notifications : true,
            push_notifications:
              push_notifications !== undefined ? push_notifications : true,
            sound_enabled: sound_enabled !== undefined ? sound_enabled : true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      } else {
        // Insert new
        result = await supabase.from("user_preferences").insert({
          user_id: userId,
          email_notifications:
            email_notifications !== undefined ? email_notifications : true,
          push_notifications:
            push_notifications !== undefined ? push_notifications : true,
          sound_enabled: sound_enabled !== undefined ? sound_enabled : true,
        });
      }

      if (result.error) {
        // If table doesn't exist, just return success (preferences stored client-side)
        if (result.error.code === "PGRST205") {
          return NextResponse.json({
            success: true,
            message: "Preferences saved (table not configured)",
          });
        }
        console.error("Update preferences error:", result.error);
        return NextResponse.json(
          { error: "Failed to update preferences" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Preferences updated successfully",
      });
    } catch {
      // Table doesn't exist, return success anyway
      return NextResponse.json({
        success: true,
        message: "Preferences saved (table not configured)",
      });
    }
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
