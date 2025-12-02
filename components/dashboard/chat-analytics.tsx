"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, MessageSquare, Users, TrendingUp, Search, Globe, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChatStats {
    totalMessages: number;
    totalUsers: number;
    totalGroups: number;
    messagesPerDay: { date: string; count: number }[];
    topGroups: { name: string; messageCount: number }[];
    activeUsers: { email: string; messageCount: number }[];
    messageTypes: { type: string; count: number }[];
    recentLogins: { email: string; lastLogin: string; loginCount: number }[];
    usersByRole: { role: string; count: number }[];
}

export default function ChatAnalytics() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ChatStats | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredMessages, setFilteredMessages] = useState<any[]>([]);

    useEffect(() => {
        fetchChatAnalytics();
    }, []);

    const fetchChatAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/chat/analytics");
            const data = await response.json();

            if (response.ok) {
                setStats(data.stats);
            } else {
                toast.error(data.error || "Failed to fetch analytics");
            }
        } catch (error) {
            console.error("Error fetching chat analytics:", error);
            toast.error("Failed to load chat analytics");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.error("Please enter a search term");
            return;
        }

        try {
            const response = await fetch(`/api/chat/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (response.ok) {
                setFilteredMessages(data.messages || []);
                toast.success(`Found ${data.messages?.length || 0} messages`);
            } else {
                toast.error(data.error || "Search failed");
            }
        } catch (error) {
            console.error("Error searching messages:", error);
            toast.error("Search failed");
        }
    };

    // Simple pie chart component using CSS conic-gradient
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
                    className="w-36 h-36 sm:w-48 sm:h-48 rounded-full flex-shrink-0"
                    style={{
                        background: `conic-gradient(${gradientString})`,
                    }}
                    role="img"
                    aria-label="Message types distribution pie chart"
                />
                <div className="space-y-2 w-full sm:w-auto">
                    {data.map((item, idx) => {
                        const colorClasses: Record<string, string> = {
                            '#7dd3fc': 'color-indicator-sky',
                            '#5eead4': 'color-indicator-teal',
                            '#fcd34d': 'color-indicator-amber',
                            '#f9a8d4': 'color-indicator-pink',
                            '#c4b5fd': 'color-indicator-violet',
                        };
                        return (
                            <div key={idx} className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded flex-shrink-0 ${colorClasses[item.color] || 'bg-primary'}`} />
                                <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                                <span className="text-xs sm:text-sm text-muted-foreground">
                                    ({item.value} - {((item.value / total) * 100).toFixed(1)}%)
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

    if (!stats) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                No analytics data available
            </div>
        );
    }

    const messageTypesData = stats.messageTypes.map((type, idx) => {
        const colors = ["#7dd3fc", "#5eead4", "#fcd34d", "#f9a8d4", "#c4b5fd"];
        return {
            label: type.type,
            value: type.count,
            color: colors[idx % colors.length],
        };
    });

    const totalMessagesByType = stats.messageTypes.reduce((acc, type) => acc + type.count, 0);

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-2 animate-slide-in-up">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary shadow-lg shadow-primary/20">
                        <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Chat Analytics</h1>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            Comprehensive chat statistics and insights
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Section */}
            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow animate-scale-in animate-delay-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Search Messages
                    </CardTitle>
                    <CardDescription>
                        Search through all chat messages, users, groups, and content
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search messages, users, groups..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <Button onClick={handleSearch}>
                            <Search className="h-4 w-4 mr-2" />
                            Search
                        </Button>
                    </div>
                    {filteredMessages.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                            {filteredMessages.map((msg: any) => (
                                <div key={msg.id} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-sm">{msg.user_email}</p>
                                            <p className="text-sm text-muted-foreground">{msg.group_name}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(msg.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm">{msg.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 animate-slide-in-up animate-delay-200">
                <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-border/50 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-400/10 to-indigo-300/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                        <div className="p-2 rounded-lg bg-sky-400/10 group-hover:bg-sky-400/20 transition-colors">
                            <MessageSquare className="h-4 w-4 text-sky-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">{stats.totalMessages.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Across all groups</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-border/50 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-emerald-300/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <div className="p-2 rounded-lg bg-teal-400/10 group-hover:bg-teal-400/20 transition-colors">
                            <Users className="h-4 w-4 text-teal-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">{stats.totalUsers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Participating in chats</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-border/50 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 to-fuchsia-300/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium">Chat Groups</CardTitle>
                        <div className="p-2 rounded-lg bg-violet-400/10 group-hover:bg-violet-400/20 transition-colors">
                            <Globe className="h-4 w-4 text-violet-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{stats.totalGroups.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total groups created</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-border/50 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-300/10 to-orange-300/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium">Recent Logins</CardTitle>
                        <div className="p-2 rounded-lg bg-amber-300/10 group-hover:bg-amber-300/20 transition-colors">
                            <TrendingUp className="h-4 w-4 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{stats.recentLogins.length}</div>
                        <p className="text-xs text-muted-foreground">Last 7 days</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pie Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Message Types Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Message Types Distribution</CardTitle>
                        <CardDescription>Breakdown of message types across all chats</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-4">
                        {messageTypesData.length > 0 ? (
                            <PieChart data={messageTypesData} total={totalMessagesByType} />
                        ) : (
                            <p className="text-muted-foreground">No data available</p>
                        )}
                    </CardContent>
                </Card>

                {/* Top Active Groups */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Active Groups</CardTitle>
                        <CardDescription>Groups with most messages</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.topGroups.slice(0, 5).map((group, idx) => {
                                const maxCount = stats.topGroups[0]?.messageCount || 1;
                                const percentage = (group.messageCount / maxCount) * 100;
                                return (
                                    <div key={idx}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium">{group.name}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {group.messageCount} messages
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
            </div>

            {/* Most Active Users */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Most Active Users
                    </CardTitle>
                    <CardDescription>Users with highest message counts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {stats.activeUsers.slice(0, 6).map((user, idx) => (
                            <div key={idx} className="p-3 sm:p-4 border rounded-lg">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary font-bold text-sm sm:text-base flex-shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-xs sm:text-sm truncate">{user.email}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                                            {user.messageCount} messages
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Daily Activity Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Message Activity</CardTitle>
                    <CardDescription>Messages sent per day over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {stats.messagesPerDay.slice(-10).map((day, idx) => {
                            const maxCount = Math.max(...stats.messagesPerDay.map((d) => d.count));
                            const percentage = (day.count / maxCount) * 100;
                            return (
                                <div key={idx}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">
                                            {new Date(day.date).toLocaleDateString()}
                                        </span>
                                        <span className="text-sm text-muted-foreground">{day.count} messages</span>
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

            {/* Login Information */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Login Activity</CardTitle>
                        <CardDescription>Users who logged in recently</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.recentLogins.slice(0, 10).map((login, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-xs sm:text-sm truncate">{login.email}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                            Last: {new Date(login.lastLogin).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs sm:text-sm font-semibold">{login.loginCount}x</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">logins</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Users by Role</CardTitle>
                        <CardDescription>Distribution of user roles in the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.usersByRole.map((role, idx) => {
                                const maxCount = Math.max(...stats.usersByRole.map((r) => r.count));
                                const percentage = (role.count / maxCount) * 100;
                                return (
                                    <div key={idx}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium capitalize">{role.role}</span>
                                            <span className="text-sm text-muted-foreground">{role.count} users</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-purple-500 h-2 rounded-full transition-all"
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
        </div>
    );
}
