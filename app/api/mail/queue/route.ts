import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data: queue, error } = await supabase
      .from("email_queue")
      .select("*")
      .order("scheduled_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ queue: queue || [] });
  } catch (error: any) {
    console.error("Error fetching queue:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch queue" },
      { status: 500 }
    );
  }
}
