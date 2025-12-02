import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Track page view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pagePath,
      pageTitle,
      referrer,
      sessionId,
      userId,
      userAgent,
      deviceType,
      browser,
      os,
    } = body;

    // Get IP and location (in production, use a proper GeoIP service)
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";

    // Insert page view
    const { error: pvError } = await supabase
      .from("web_analytics_pageviews")
      .insert({
        page_path: pagePath,
        page_title: pageTitle,
        referrer: referrer || null,
        session_id: sessionId,
        user_id: userId || null,
        user_agent: userAgent,
        ip_address: ip,
        device_type: deviceType,
        browser,
        os,
      });

    if (pvError) throw pvError;

    // Update or create session
    const { data: existingSession } = await supabase
      .from("web_analytics_sessions")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    if (existingSession) {
      // Update existing session
      await supabase
        .from("web_analytics_sessions")
        .update({
          page_count: (existingSession.page_count || 0) + 1,
          exit_page: pagePath,
          ended_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId);
    } else {
      // Create new session
      await supabase
        .from("web_analytics_sessions")
        .insert({
          session_id: sessionId,
          user_id: userId || null,
          ip_address: ip,
          device_type: deviceType,
          browser,
          os,
          landing_page: pagePath,
          exit_page: pagePath,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error tracking page view:", error);
    return NextResponse.json(
      { error: error.message || "Failed to track page view" },
      { status: 500 }
    );
  }
}
