import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get count of sent emails
    const { count: totalSent } = await supabase
      .from("email_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent");

    // Get count of pending emails
    const { count: totalPending } = await supabase
      .from("email_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Get count of failed emails
    const { count: totalFailed } = await supabase
      .from("email_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed");

    // Get recent emails
    const { data: recentEmails } = await supabase
      .from("email_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    const stats = {
      totalSent: totalSent || 0,
      totalPending: totalPending || 0,
      totalFailed: totalFailed || 0,
      recentEmails: recentEmails || [],
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
