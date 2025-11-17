import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET all groups (for database management - admin only)
export async function GET() {
  try {
    const { data: groups, error } = await supabase
      .from("chat_groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch all groups error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ groups: groups || [] });
  } catch (error) {
    console.error("Get all groups error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
