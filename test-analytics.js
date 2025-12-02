// Test Web Analytics Tracking API
// Run with: node test-analytics.js

const BASE_URL = "http://localhost:3000";

async function testTracking() {
    console.log("🔍 Testing Web Analytics Tracking API...\n");

    const testData = {
        pagePath: "/test-page",
        pageTitle: "Test Page Title",
        referrer: "https://google.com",
        sessionId: `test-session-${Date.now()}`,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        deviceType: "desktop",
        browser: "Chrome",
        os: "Windows 10",
    };

    try {
        console.log("📤 Sending test page view...");
        console.log("   Data:", JSON.stringify(testData, null, 2));

        const response = await fetch(`${BASE_URL}/api/analytics/track`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(testData),
        });

        const result = await response.json();

        if (response.ok) {
            console.log("\n✅ Page view tracked successfully!");
            console.log("   Response:", result);
        } else {
            console.log("\n❌ Failed to track page view:");
            console.log("   Status:", response.status);
            console.log("   Error:", result);
        }

        // Now test fetching analytics
        console.log("\n\n📊 Fetching Web Analytics Data...");

        const analyticsResponse = await fetch(`${BASE_URL}/api/analytics/web?days=7`);
        const analyticsData = await analyticsResponse.json();

        if (analyticsResponse.ok) {
            console.log("\n✅ Analytics data fetched successfully!");
            console.log("   Total Page Views:", analyticsData.analytics?.totalPageViews);
            console.log("   Unique Visitors:", analyticsData.analytics?.uniqueVisitors);
            console.log("   Top Pages:", analyticsData.analytics?.topPages?.slice(0, 3));
            console.log("   Device Types:", analyticsData.analytics?.deviceTypes);
        } else {
            console.log("\n❌ Failed to fetch analytics:");
            console.log("   Error:", analyticsData);
        }

    } catch (error) {
        console.log("\n❌ Error during test:");
        console.log("   ", error.message);
        console.log("\n💡 Make sure your dev server is running: bun run dev");
    }
}

testTracking();
