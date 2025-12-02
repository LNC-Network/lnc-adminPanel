"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Users, Eye, Globe, Monitor, Chrome, ArrowUpRight, Clock, MousePointer, Activity } from "lucide-react";
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
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full flex-shrink-0"
                    style={{
                        background: `conic-gradient(${gradientString})`,
                    }}
                    role="img"
                    aria-label="Device distribution pie chart"
                />
                <div className="space-y-2 w-full sm:w-auto">
                    {data.map((item, idx) => {
                        const colorClasses: Record<string, string> = {
                            '#7dd3fc': 'color-indicator-sky',
                            '#5eead4': 'color-indicator-teal',
                            '#fcd34d': 'color-indicator-amber',
                            '#f9a8d4': 'color-indicator-pink',
                        };
                        return (
                            <div key={idx} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded flex-shrink-0 ${colorClasses[item.color] || 'bg-primary'}`} />
                                <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                                <span className="text-xs sm:text-sm text-muted-foreground">
                                    ({item.value.toLocaleString()} - {((item.value / total) * 100).toFixed(1)}%)
                                </span>
                            </div>
                        );
                    })}
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

    const deviceColors = ["#7dd3fc", "#5eead4", "#fcd34d", "#f9a8d4"];
    const deviceData = analytics.deviceTypes.map((device, idx) => ({
        label: device.type.charAt(0).toUpperCase() + device.type.slice(1),
        value: device.count,
        color: deviceColors[idx % deviceColors.length],
    }));
    const totalDeviceCount = analytics.deviceTypes.reduce((sum, d) => sum + d.count, 0);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary shadow-lg shadow-primary/20">
                            <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Web Analytics</h1>
                            <p className="text-muted-foreground text-xs sm:text-sm">
                                Monitor website performance and visitor insights
                            </p>
                        </div>
                    </div>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 animate-slide-in-up animate-delay-100">
                <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-border/50 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-400/10 to-indigo-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                        <div className="p-2 rounded-lg bg-sky-400/10 group-hover:bg-sky-400/20 transition-colors">
                            <Eye className="h-4 w-4 text-sky-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">{analytics.totalPageViews.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total page views</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-border/50 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                        <div className="p-2 rounded-lg bg-teal-400/10 group-hover:bg-teal-400/20 transition-colors">
                            <Users className="h-4 w-4 text-teal-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">{analytics.uniqueVisitors.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Unique sessions</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-border/50 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 to-fuchsia-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
                        <div className="p-2 rounded-lg bg-violet-400/10 group-hover:bg-violet-400/20 transition-colors">
                            <Clock className="h-4 w-4 text-violet-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{formatDuration(analytics.avgSessionDuration)}</div>
                        <p className="text-xs text-muted-foreground">Time on site</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-border/50 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-300/10 to-orange-300/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                        <div className="p-2 rounded-lg bg-amber-300/10 group-hover:bg-amber-300/20 transition-colors">
                            <MousePointer className="h-4 w-4 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{analytics.bounceRate}%</div>
                        <p className="text-xs text-muted-foreground">Single page visits</p>
                    </CardContent>
                </Card>
            </div>

            {/* Traffic Chart */}
            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
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
                                    <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="h-2.5 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
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
                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            Top Pages
                        </CardTitle>
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
                                        <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="h-2.5 rounded-full transition-all duration-500 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
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
                    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
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
