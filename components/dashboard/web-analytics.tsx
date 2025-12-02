"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, Eye, Globe, Monitor, Chrome, ArrowUpRight, Clock, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WebAnalytics {
    totalPageViews: number;
    uniqueVisitors: number;
    topPages: { path: string; title: string; count: number }[];
    pageViewsByDay: { date: string; count: number }[];
    topCountries: { country: string; count: number }[];
    topCities: { city: string; country: string; count: number }[];
    deviceTypes: { type: string; count: number }[];
    topBrowsers: { browser: string; count: number }[];
    topReferrers: { referrer: string; count: number }[];
    avgPerformance: {
        loadTime: number;
        ttfb: number;
        fcp: number;
        lcp: number;
        fid: number;
        cls: number;
    };
    avgSessionDuration: number;
    bounceRate: number;
}

export default function WebAnalytics() {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<WebAnalytics | null>(null);
    const [timeRange, setTimeRange] = useState("30");

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/analytics/web?days=${timeRange}`);
            const data = await response.json();

            if (response.ok) {
                setAnalytics(data.analytics);
            } else {
                toast.error(data.error || "Failed to fetch analytics");
            }
        } catch (error) {
            console.error("Error fetching web analytics:", error);
            toast.error("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const PieChart = ({ data, total }: { data: { label: string; value: number; color: string }[]; total: number }) => {
        let currentAngle = 0;
        const segments = data.map((item) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const segment = {
                ...item,
                startAngle: currentAngle,
                endAngle: currentAngle + angle,
                percentage,
            };
            currentAngle += angle;
            return segment;
        });

        const gradientString = segments
            .map((seg) => `${seg.color} ${seg.startAngle}deg ${seg.endAngle}deg`)
            .join(", ");

        return (
            <div className="flex items-center gap-6">
                <div
                    className="w-40 h-40 rounded-full"
                    style={{
                        background: `conic-gradient(${gradientString})`,
                    }}
                />
                <div className="space-y-2">
                    {data.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                            <span className="text-sm font-medium">{item.label}</span>
                            <span className="text-sm text-muted-foreground">
                                ({item.value.toLocaleString()} - {((item.value / total) * 100).toFixed(1)}%)
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                No analytics data available
            </div>
        );
    }

    const deviceColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
    const deviceData = analytics.deviceTypes.map((device, idx) => ({
        label: device.type.charAt(0).toUpperCase() + device.type.slice(1),
        value: device.count,
        color: deviceColors[idx % deviceColors.length],
    }));
    const totalDeviceCount = analytics.deviceTypes.reduce((sum, d) => sum + d.count, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Web Analytics</h1>
                        <p className="text-muted-foreground text-sm">
                            Comprehensive website performance and visitor insights
                        </p>
                    </div>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalPageViews.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total visits</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.uniqueVisitors.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Unique sessions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(analytics.avgSessionDuration)}</div>
                        <p className="text-xs text-muted-foreground">Time on site</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                        <MousePointer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.bounceRate}%</div>
                        <p className="text-xs text-muted-foreground">Single page visits</p>
                    </CardContent>
                </Card>
            </div>

            {/* Traffic Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Traffic Overview</CardTitle>
                    <CardDescription>Daily page views for the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {analytics.pageViewsByDay.slice(-14).map((day, idx) => {
                            const maxCount = Math.max(...analytics.pageViewsByDay.map((d) => d.count));
                            const percentage = (day.count / maxCount) * 100;
                            return (
                                <div key={idx}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">
                                            {new Date(day.date).toLocaleDateString()}
                                        </span>
                                        <span className="text-sm text-muted-foreground">{day.count} views</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Top Pages & Geographic Data */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Pages</CardTitle>
                        <CardDescription>Most visited pages</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics.topPages.slice(0, 8).map((page, idx) => {
                                const maxCount = analytics.topPages[0]?.count || 1;
                                const percentage = (page.count / maxCount) * 100;
                                return (
                                    <div key={idx}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium truncate max-w-[250px]" title={page.path}>
                                                {page.title}
                                            </span>
                                            <span className="text-sm text-muted-foreground flex-shrink-0">
                                                {page.count} views
                                            </span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Top Locations
                        </CardTitle>
                        <CardDescription>Visitors by country</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics.topCountries.slice(0, 8).map((country, idx) => {
                                const maxCount = analytics.topCountries[0]?.count || 1;
                                const percentage = (country.count / maxCount) * 100;
                                return (
                                    <div key={idx}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium">{country.country}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {country.count} visitors
                                            </span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Device & Browser Analytics */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="h-5 w-5" />
                            Device Types
                        </CardTitle>
                        <CardDescription>Visitor device distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-4">
                        {deviceData.length > 0 ? (
                            <PieChart data={deviceData} total={totalDeviceCount} />
                        ) : (
                            <p className="text-muted-foreground">No data available</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Chrome className="h-5 w-5" />
                            Top Browsers
                        </CardTitle>
                        <CardDescription>Most used browsers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics.topBrowsers.slice(0, 6).map((browser, idx) => {
                                const maxCount = analytics.topBrowsers[0]?.count || 1;
                                const percentage = (browser.count / maxCount) * 100;
                                return (
                                    <div key={idx}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium">{browser.browser}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {browser.count} users
                                            </span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-orange-500 h-2 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Average website performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                        <div className="p-4 border rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Load Time</p>
                            <p className="text-2xl font-bold">{analytics.avgPerformance.loadTime}ms</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">TTFB</p>
                            <p className="text-2xl font-bold">{analytics.avgPerformance.ttfb}ms</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">FCP</p>
                            <p className="text-2xl font-bold">{analytics.avgPerformance.fcp}ms</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">LCP</p>
                            <p className="text-2xl font-bold">{analytics.avgPerformance.lcp}ms</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">FID</p>
                            <p className="text-2xl font-bold">{analytics.avgPerformance.fid}ms</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">CLS</p>
                            <p className="text-2xl font-bold">{analytics.avgPerformance.cls}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Top Referrers */}
            {analytics.topReferrers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowUpRight className="h-5 w-5" />
                            Top Referrers
                        </CardTitle>
                        <CardDescription>Where your traffic comes from</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                            {analytics.topReferrers.map((referrer, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                    <span className="text-sm font-medium truncate">{referrer.referrer}</span>
                                    <span className="text-sm text-muted-foreground flex-shrink-0 ml-4">
                                        {referrer.count} visits
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
