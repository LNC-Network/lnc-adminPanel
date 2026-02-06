import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Track performance metrics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      pagePath,
      // Core Web Vitals
      lcp, // Largest Contentful Paint
      fid, // First Input Delay
      cls, // Cumulative Layout Shift
      // Other metrics
      ttfb, // Time to First Byte
      fcp, // First Contentful Paint
      domInteractive,
      domComplete,
      loadTime,
    } = body;

    // Insert performance metrics
    const { error } = await supabase
      .from("web_analytics_performance")
      .insert({
        session_id: sessionId,
        page_path: pagePath,
        lcp: lcp || null,
        fid: fid || null,
        cls: cls || null,
        ttfb: ttfb || null,
        fcp: fcp || null,
        dom_interactive: domInteractive || null,
        dom_complete: domComplete || null,
        load_time: loadTime || null,
      });

    if (error) {
      // Table might not exist, just log and return success
      console.warn("Performance tracking error (table may not exist):", error.message);
      return NextResponse.json({ success: true, warning: "Performance tracking not configured" });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Performance tracking error:", error);
    return NextResponse.json(
      { success: true, warning: "Performance tracking failed" },
      { status: 200 } // Return 200 to avoid client-side errors
    );
  }
}
