"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Generate a unique session ID
function generateSessionId(): string {
    const stored = sessionStorage.getItem("analytics_session_id");
    if (stored) return stored;

    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem("analytics_session_id", id);
    return id;
}

// Detect device type
function getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "tablet";
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return "mobile";
    }
    return "desktop";
}

// Detect browser
function getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("SamsungBrowser")) return "Samsung";
    if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
    if (ua.includes("Trident")) return "IE";
    if (ua.includes("Edge")) return "Edge";
    if (ua.includes("Edg")) return "Edge Chromium";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari")) return "Safari";
    return "Unknown";
}

// Detect OS
function getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes("Windows NT 10.0")) return "Windows 10";
    if (ua.includes("Windows NT 6.3")) return "Windows 8.1";
    if (ua.includes("Windows NT 6.2")) return "Windows 8";
    if (ua.includes("Windows NT 6.1")) return "Windows 7";
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac OS X")) return "macOS";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
    if (ua.includes("Linux")) return "Linux";
    return "Unknown";
}

interface TrackingData {
    pagePath: string;
    pageTitle: string;
    referrer: string;
    sessionId: string;
    userId?: string;
    userAgent: string;
    deviceType: string;
    browser: string;
    os: string;
}

async function trackPageView(data: TrackingData): Promise<void> {
    try {
        await fetch("/api/analytics/track", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error("Failed to track page view:", error);
    }
}

// Track performance metrics
async function trackPerformance(pagePath: string): Promise<void> {
    if (typeof window === "undefined" || !window.performance) return;

    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));

    const perfEntries = performance.getEntriesByType("navigation");
    if (perfEntries.length === 0) return;

    const navTiming = perfEntries[0] as PerformanceNavigationTiming;

    // Get Web Vitals if available
    const paintEntries = performance.getEntriesByType("paint");
    const fcpEntry = paintEntries.find(entry => entry.name === "first-contentful-paint");

    try {
        await fetch("/api/analytics/track/performance", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                pagePath,
                loadTime: Math.round(navTiming.loadEventEnd - navTiming.startTime),
                ttfb: Math.round(navTiming.responseStart - navTiming.requestStart),
                fcp: fcpEntry ? Math.round(fcpEntry.startTime) : null,
            }),
        });
    } catch (error) {
        // Silently fail for performance tracking
    }
}

export default function AnalyticsTracker(): null {
    const pathname = usePathname();
    const lastPathRef = useRef<string>("");

    useEffect(() => {
        // Skip if same path (prevent double tracking)
        if (lastPathRef.current === pathname) return;
        lastPathRef.current = pathname;

        // Don't track API routes or internal routes
        if (pathname.startsWith("/api/") || pathname.startsWith("/_")) return;

        const data: TrackingData = {
            pagePath: pathname,
            pageTitle: document.title,
            referrer: document.referrer,
            sessionId: generateSessionId(),
            userAgent: navigator.userAgent,
            deviceType: getDeviceType(),
            browser: getBrowser(),
            os: getOS(),
        };

        // Track page view
        trackPageView(data);

        // Track performance after a delay
        trackPerformance(pathname);
    }, [pathname]);

    return null;
}
