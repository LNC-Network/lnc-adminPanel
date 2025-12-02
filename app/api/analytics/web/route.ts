import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total page views
    const { count: totalPageViews } = await supabase
      .from("web_analytics_pageviews")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString());

    // Unique visitors (unique session IDs)
    const { data: sessions } = await supabase
      .from("web_analytics_sessions")
      .select("session_id")
      .gte("started_at", startDate.toISOString());

    const uniqueVisitors = new Set(sessions?.map(s => s.session_id) || []).size;

    // Top pages
    const { data: pageViewsData } = await supabase
      .from("web_analytics_pageviews")
      .select("page_path, page_title")
      .gte("created_at", startDate.toISOString());

    const pageCounts: { [key: string]: { path: string; title: string; count: number } } = {};
    pageViewsData?.forEach((pv: any) => {
      const key = pv.page_path;
      if (!pageCounts[key]) {
        pageCounts[key] = { path: pv.page_path, title: pv.page_title || pv.page_path, count: 0 };
      }
      pageCounts[key].count++;
    });

    const topPages = Object.values(pageCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Page views by day
    const { data: dailyData } = await supabase
      .from("web_analytics_pageviews")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    const viewsByDay: { [key: string]: number } = {};
    dailyData?.forEach((item: any) => {
      const date = new Date(item.created_at).toISOString().split("T")[0];
      viewsByDay[date] = (viewsByDay[date] || 0) + 1;
    });

    const pageViewsByDay = Object.entries(viewsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Geographic data
    const { data: geoData } = await supabase
      .from("web_analytics_pageviews")
      .select("country, city")
      .gte("created_at", startDate.toISOString());

    const countryCounts: { [key: string]: number } = {};
    const cityCounts: { [key: string]: { city: string; country: string; count: number } } = {};

    geoData?.forEach((item: any) => {
      if (item.country) {
        countryCounts[item.country] = (countryCounts[item.country] || 0) + 1;
      }
      if (item.city && item.country) {
        const key = `${item.city}, ${item.country}`;
        if (!cityCounts[key]) {
          cityCounts[key] = { city: item.city, country: item.country, count: 0 };
        }
        cityCounts[key].count++;
      }
    });

    const topCountries = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topCities = Object.values(cityCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Device types
    const { data: deviceData } = await supabase
      .from("web_analytics_pageviews")
      .select("device_type")
      .gte("created_at", startDate.toISOString());

    const deviceCounts: { [key: string]: number } = {};
    deviceData?.forEach((item: any) => {
      if (item.device_type) {
        deviceCounts[item.device_type] = (deviceCounts[item.device_type] || 0) + 1;
      }
    });

    const deviceTypes = Object.entries(deviceCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Browsers
    const { data: browserData } = await supabase
      .from("web_analytics_pageviews")
      .select("browser")
      .gte("created_at", startDate.toISOString());

    const browserCounts: { [key: string]: number } = {};
    browserData?.forEach((item: any) => {
      if (item.browser) {
        browserCounts[item.browser] = (browserCounts[item.browser] || 0) + 1;
      }
    });

    const topBrowsers = Object.entries(browserCounts)
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Referrers
    const { data: referrerData } = await supabase
      .from("web_analytics_pageviews")
      .select("referrer")
      .gte("created_at", startDate.toISOString())
      .not("referrer", "is", null)
      .neq("referrer", "");

    const referrerCounts: { [key: string]: number } = {};
    referrerData?.forEach((item: any) => {
      if (item.referrer) {
        try {
          const url = new URL(item.referrer);
          const domain = url.hostname;
          referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
        } catch (e) {
          // Invalid URL
        }
      }
    });

    const topReferrers = Object.entries(referrerCounts)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Average performance metrics
    const { data: perfData } = await supabase
      .from("web_analytics_performance")
      .select("load_time, ttfb, fcp, lcp, fid, cls")
      .gte("created_at", startDate.toISOString());

    const avgPerformance = {
      loadTime: 0,
      ttfb: 0,
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
    };

    if (perfData && perfData.length > 0) {
      const count = perfData.length;
      perfData.forEach((p: any) => {
        avgPerformance.loadTime += p.load_time || 0;
        avgPerformance.ttfb += p.ttfb || 0;
        avgPerformance.fcp += p.fcp || 0;
        avgPerformance.lcp += p.lcp || 0;
        avgPerformance.fid += p.fid || 0;
        avgPerformance.cls += parseFloat(p.cls) || 0;
      });

      avgPerformance.loadTime = Math.round(avgPerformance.loadTime / count);
      avgPerformance.ttfb = Math.round(avgPerformance.ttfb / count);
      avgPerformance.fcp = Math.round(avgPerformance.fcp / count);
      avgPerformance.lcp = Math.round(avgPerformance.lcp / count);
      avgPerformance.fid = Math.round(avgPerformance.fid / count);
      avgPerformance.cls = parseFloat((avgPerformance.cls / count).toFixed(3));
    }

    // Average session duration
    const { data: sessionData } = await supabase
      .from("web_analytics_sessions")
      .select("total_duration")
      .gte("started_at", startDate.toISOString())
      .not("total_duration", "is", null);

    const totalDuration = sessionData?.reduce((sum: number, s: any) => sum + (s.total_duration || 0), 0) || 0;
    const avgSessionDuration = sessionData?.length ? Math.round(totalDuration / sessionData.length) : 0;

    // Bounce rate (sessions with only 1 page view)
    const { data: bounceData } = await supabase
      .from("web_analytics_sessions")
      .select("page_count")
      .gte("started_at", startDate.toISOString());

    const totalSessions = bounceData?.length || 1;
    const bouncedSessions = bounceData?.filter((s: any) => s.page_count === 1).length || 0;
    const bounceRate = Math.round((bouncedSessions / totalSessions) * 100);

    const analytics = {
      totalPageViews: totalPageViews || 0,
      uniqueVisitors,
      topPages,
      pageViewsByDay,
      topCountries,
      topCities,
      deviceTypes,
      topBrowsers,
      topReferrers,
      avgPerformance,
      avgSessionDuration,
      bounceRate,
    };

    return NextResponse.json({ analytics });
  } catch (error: any) {
    console.error("Error fetching web analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
