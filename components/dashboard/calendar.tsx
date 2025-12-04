"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Edit, Trash2, X, Loader2, ExternalLink, Unlink, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Event {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    date: string; // YYYY-MM-DD
    time?: string;
    color: string;
    isGoogleEvent?: boolean;
    googleEventId?: string;
    htmlLink?: string;
}

const eventColors = [
    { value: "bg-blue-500", label: "Blue" },
    { value: "bg-rose-500", label: "Rose" },
    { value: "bg-green-500", label: "Green" },
    { value: "bg-yellow-500", label: "Yellow" },
    { value: "bg-purple-500", label: "Purple" },
    { value: "bg-pink-500", label: "Pink" },
    { value: "bg-indigo-500", label: "Indigo" },
    { value: "bg-orange-500", label: "Orange" },
];

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
    const [newEventTitle, setNewEventTitle] = useState("");
    const [newEventDescription, setNewEventDescription] = useState("");
    const [newEventDate, setNewEventDate] = useState("");
    const [newEventTime, setNewEventTime] = useState("");
    const [newEventColor, setNewEventColor] = useState("bg-blue-500");
    const [syncToGoogle, setSyncToGoogle] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewEventDialog, setViewEventDialog] = useState(false);
    const [userId, setUserId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showGoogleEvents, setShowGoogleEvents] = useState(true);

    // Load user ID from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem("user");
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    setUserId(user.id || "");
                } catch (e) {
                    console.error("Failed to parse user data:", e);
                }
            }
        }
    }, []);

    // Fetch events from database when userId is available
    useEffect(() => {
        if (userId) {
            fetchEvents();
            checkGoogleConnection();
        }
    }, [userId]);

    // Fetch Google events when month changes or connection status changes
    useEffect(() => {
        if (userId && googleConnected) {
            fetchGoogleEvents();
        }
    }, [userId, googleConnected, currentDate]);

    const checkGoogleConnection = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`/api/calendar/google?userId=${userId}`);
            const data = await response.json();
            setGoogleConnected(data.connected === true);
        } catch (error) {
            setGoogleConnected(false);
        }
    };

    const fetchGoogleEvents = async () => {
        if (!userId || !googleConnected) return;

        setGoogleLoading(true);
        try {
            // Get first and last day of current month view
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            const timeMin = firstDay.toISOString();
            const timeMax = lastDay.toISOString();

            const response = await fetch(
                `/api/calendar/google?userId=${userId}&timeMin=${timeMin}&timeMax=${timeMax}`
            );
            const data = await response.json();

            if (data.connected && data.events) {
                setGoogleEvents(data.events);
            } else {
                setGoogleConnected(false);
                setGoogleEvents([]);
            }
        } catch (error) {
            console.error("Error fetching Google events:", error);
        } finally {
            setGoogleLoading(false);
        }
    };

    const connectGoogleCalendar = async () => {
        if (!userId) {
            toast.error("User not authenticated");
            return;
        }

        setGoogleLoading(true);
        try {
            const response = await fetch(`/api/auth/google?userId=${userId}`);
            const data = await response.json();

            if (data.authUrl) {
                window.location.href = data.authUrl;
            } else {
                toast.error("Failed to get auth URL");
            }
        } catch (error) {
            console.error("Google connect error:", error);
            toast.error("Failed to connect Google Calendar");
        } finally {
            setGoogleLoading(false);
        }
    };

    const disconnectGoogleCalendar = async () => {
        if (!userId) return;

        const confirmed = window.confirm("Are you sure you want to disconnect Google Calendar?");
        if (!confirmed) return;

        setGoogleLoading(true);
        try {
            // Delete tokens from database
            const response = await fetch(`/api/calendar/google/disconnect?userId=${userId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setGoogleConnected(false);
                setGoogleEvents([]);
                toast.success("Google Calendar disconnected");
            } else {
                toast.error("Failed to disconnect");
            }
        } catch (error) {
            console.error("Disconnect error:", error);
            toast.error("Failed to disconnect Google Calendar");
        } finally {
            setGoogleLoading(false);
        }
    };

    const fetchEvents = async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/calendar?userId=${userId}`);
            const data = await response.json();

            if (response.ok) {
                setEvents(data.events || []);
            } else {
                toast.error(data.error || "Failed to fetch events");
            }
        } catch (error) {
            console.error("Error fetching events:", error);
            toast.error("Failed to load events");
        } finally {
            setLoading(false);
        }
    };

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const resetForm = () => {
        setNewEventTitle("");
        setNewEventDescription("");
        setNewEventDate("");
        setNewEventTime("");
        setNewEventColor("bg-blue-500");
        setSyncToGoogle(false);
        setIsEditMode(false);
        setSelectedEvent(null);
    };

    const handleAddEvent = async () => {
        if (!newEventTitle || !newEventDate) {
            toast.error("Please fill in required fields");
            return;
        }

        if (!userId) {
            toast.error("User not authenticated");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    title: newEventTitle,
                    description: newEventDescription,
                    date: newEventDate,
                    time: newEventTime,
                    color: newEventColor,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                await fetchEvents(); // Refresh events

                // Also sync to Google Calendar if requested
                if (syncToGoogle && googleConnected) {
                    try {
                        await fetch("/api/calendar/google", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                userId,
                                title: newEventTitle,
                                description: newEventDescription,
                                date: newEventDate,
                                time: newEventTime,
                            }),
                        });
                        await fetchGoogleEvents();
                    } catch (error) {
                        console.error("Failed to sync to Google:", error);
                    }
                }

                resetForm();
                setIsDialogOpen(false);
                toast.success("Event added successfully");
            } else {
                toast.error(data.error || "Failed to add event");
            }
        } catch (error) {
            console.error("Error adding event:", error);
            toast.error("Failed to add event");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEvent = async () => {
        if (!selectedEvent || !newEventTitle || !newEventDate) {
            toast.error("Please fill in required fields");
            return;
        }

        if (!userId) {
            toast.error("User not authenticated");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/calendar", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId: selectedEvent.id,
                    userId,
                    title: newEventTitle,
                    description: newEventDescription,
                    date: newEventDate,
                    time: newEventTime,
                    color: newEventColor,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                await fetchEvents(); // Refresh events
                resetForm();
                setIsDialogOpen(false);
                toast.success("Event updated successfully");
            } else {
                toast.error(data.error || "Failed to update event");
            }
        } catch (error) {
            console.error("Error updating event:", error);
            toast.error("Failed to update event");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!userId) {
            toast.error("User not authenticated");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/calendar?eventId=${eventId}&userId=${userId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (response.ok) {
                await fetchEvents(); // Refresh events
                setViewEventDialog(false);
                setSelectedEvent(null);
                toast.success("Event deleted successfully");
            } else {
                toast.error(data.error || "Failed to delete event");
            }
        } catch (error) {
            console.error("Error deleting event:", error);
            toast.error("Failed to delete event");
        } finally {
            setLoading(false);
        }
    };

    const openEditDialog = (event: Event) => {
        setSelectedEvent(event);
        setNewEventTitle(event.title);
        setNewEventDescription(event.description || "");
        setNewEventDate(event.date);
        setNewEventTime(event.time || "");
        setNewEventColor(event.color);
        setIsEditMode(true);
        setViewEventDialog(false);
        setIsDialogOpen(true);
    };

    const openAddDialog = (date?: string) => {
        resetForm();
        if (date) {
            setNewEventDate(date);
        } else {
            setNewEventDate(new Date().toISOString().split('T')[0]);
        }
        setIsDialogOpen(true);
    };

    const viewEventDetails = (event: Event) => {
        setSelectedEvent(event);
        setViewEventDialog(true);
    };

    const renderCalendarDays = () => {
        const days = [];
        const today = new Date().toISOString().split('T')[0];

        // Combine local and Google events
        const allEvents = showGoogleEvents ? [...events, ...googleEvents] : events;

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] border-r border-b border-border/40 bg-muted/5"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = allEvents.filter(e => e.date === dateStr);
            const isToday = dateStr === today;

            days.push(
                <div
                    key={day}
                    className={`min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] border-r border-b border-border/40 p-1.5 sm:p-2 relative hover:bg-accent/30 hover:shadow-md transition-all duration-200 cursor-pointer group ${isToday ? 'bg-primary/5 border-primary/30 shadow-inner' : 'bg-card'}`}
                    onClick={() => openAddDialog(dateStr)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openAddDialog(dateStr)}
                    aria-label={`${day} ${monthNames[currentDate.getMonth()]} - ${dayEvents.length} events`}
                >
                    <div className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-semibold mb-1 transition-all ${isToday ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg' : 'text-foreground group-hover:bg-accent group-hover:scale-110'}`}>
                        {day}
                    </div>
                    <div className="space-y-0.5 sm:space-y-1 overflow-y-auto max-h-[calc(100%-28px)] sm:max-h-[calc(100%-36px)]">
                        {dayEvents.slice(0, 3).map(event => (
                            <div
                                key={event.id}
                                className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md text-white truncate shadow-md font-medium ${event.color} hover:scale-105 hover:shadow-lg transition-all duration-200 cursor-pointer`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    viewEventDetails(event);
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && viewEventDetails(event)}
                            >
                                {event.time && <span className="mr-1 font-bold hidden sm:inline">{event.time}</span>}
                                {event.title}
                            </div>
                        ))}
                        {dayEvents.length > 3 && (
                            <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</div>
                        )}
                    </div>
                </div>
            );
        }

        return days;
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col gap-2 animate-slide-in-up">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary shadow-lg shadow-primary/20">
                        <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Calendar</h1>
                        <p className="text-muted-foreground text-xs sm:text-sm">Manage your events and schedules.</p>
                    </div>
                </div>
            </div>

            <Card className="border-border/40 shadow-xl hover:shadow-2xl transition-shadow duration-300 animate-scale-in animate-delay-100">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <CardTitle className="text-xl sm:text-2xl font-bold">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" onClick={prevMonth} className="hover:bg-accent h-8 w-8 sm:h-9 sm:w-9" aria-label="Previous month">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={nextMonth} className="hover:bg-accent h-8 w-8 sm:h-9 sm:w-9" aria-label="Next month">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Google Calendar Connection */}
                        {googleConnected ? (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2h15A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5M18 8h-1V7a1 1 0 0 0-2 0v1H9V7a1 1 0 0 0-2 0v1H6a1 1 0 0 0 0 2h1v2H6a1 1 0 0 0 0 2h1v2H6a1 1 0 0 0 0 2h1v1a1 1 0 0 0 2 0v-1h6v1a1 1 0 0 0 2 0v-1h1a1 1 0 0 0 0-2h-1v-2h1a1 1 0 0 0 0-2h-1v-2h1a1 1 0 0 0 0-2m-3 8H9v-2h6v2m0-4H9v-2h6v2Z" />
                                    </svg>
                                    Google
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={fetchGoogleEvents}
                                    disabled={googleLoading}
                                    className="h-8 w-8"
                                    title="Refresh Google events"
                                >
                                    <RefreshCw className={`h-4 w-4 ${googleLoading ? 'animate-spin' : ''}`} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={disconnectGoogleCalendar}
                                    disabled={googleLoading}
                                    className="h-8 w-8 text-rose-500 hover:text-rose-600"
                                    title="Disconnect Google Calendar"
                                >
                                    <Unlink className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={showGoogleEvents}
                                        onCheckedChange={setShowGoogleEvents}
                                        id="show-google"
                                    />
                                    <Label htmlFor="show-google" className="text-xs cursor-pointer">Show</Label>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={connectGoogleCalendar}
                                disabled={googleLoading}
                                className="h-8"
                            >
                                {googleLoading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                )}
                                Connect Google
                            </Button>
                        )}

                        <Dialog open={isDialogOpen} onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) resetForm();
                        }}>
                            <DialogTrigger asChild>
                                <Button className="shadow-md" onClick={() => openAddDialog()}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Event
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>{isEditMode ? "Edit Event" : "Add New Event"}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="title">Event Title *</Label>
                                        <Input
                                            id="title"
                                            value={newEventTitle}
                                            onChange={(e) => setNewEventTitle(e.target.value)}
                                            placeholder="Team Meeting, Deadline, etc."
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={newEventDescription}
                                            onChange={(e) => setNewEventDescription(e.target.value)}
                                            placeholder="Add event details..."
                                            rows={3}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="date">Date *</Label>
                                            <Input
                                                id="date"
                                                type="date"
                                                value={newEventDate}
                                                onChange={(e) => setNewEventDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="time">Time</Label>
                                            <Input
                                                id="time"
                                                type="time"
                                                value={newEventTime}
                                                onChange={(e) => setNewEventTime(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="color">Color</Label>
                                        <Select value={newEventColor} onValueChange={setNewEventColor}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {eventColors.map((color) => (
                                                    <SelectItem key={color.value} value={color.value}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-4 h-4 rounded ${color.value}`} />
                                                            {color.label}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {googleConnected && !isEditMode && (
                                        <div className="flex items-center gap-2 pt-2">
                                            <Switch
                                                id="sync-google"
                                                checked={syncToGoogle}
                                                onCheckedChange={setSyncToGoogle}
                                            />
                                            <Label htmlFor="sync-google" className="cursor-pointer flex items-center gap-2">
                                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                </svg>
                                                Also add to Google Calendar
                                            </Label>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => {
                                        setIsDialogOpen(false);
                                        resetForm();
                                    }} disabled={loading}>
                                        Cancel
                                    </Button>
                                    <Button onClick={isEditMode ? handleUpdateEvent : handleAddEvent} disabled={loading}>
                                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        {isEditMode ? "Update Event" : "Create Event"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* View Event Dialog */}
                    <Dialog open={viewEventDialog} onOpenChange={setViewEventDialog}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${selectedEvent?.color}`} />
                                    {selectedEvent?.title}
                                    {selectedEvent?.isGoogleEvent && (
                                        <Badge variant="outline" className="ml-2 bg-sky-500/10 text-sky-600 border-sky-500/30">
                                            Google
                                        </Badge>
                                    )}
                                </DialogTitle>
                            </DialogHeader>
                            {selectedEvent && (
                                <div className="space-y-4 py-4">
                                    {selectedEvent.description && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Description</h4>
                                            <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Date</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    {selectedEvent.time && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Time</h4>
                                            <p className="text-sm text-muted-foreground">{selectedEvent.time}</p>
                                        </div>
                                    )}
                                    {selectedEvent.isGoogleEvent && selectedEvent.htmlLink && (
                                        <div>
                                            <a
                                                href={selectedEvent.htmlLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sm text-sky-500 hover:underline"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                Open in Google Calendar
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                            <DialogFooter className="flex gap-2 sm:justify-between">
                                {selectedEvent?.isGoogleEvent ? (
                                    <>
                                        <div></div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setViewEventDialog(false)}
                                            >
                                                Close
                                            </Button>
                                            {selectedEvent.htmlLink && (
                                                <Button
                                                    onClick={() => window.open(selectedEvent.htmlLink, '_blank')}
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Edit in Google
                                                </Button>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="destructive"
                                            onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                            Delete
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setViewEventDialog(false)}
                                                disabled={loading}
                                            >
                                                Close
                                            </Button>
                                            <Button
                                                onClick={() => selectedEvent && openEditDialog(selectedEvent)}
                                                disabled={loading}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && events.length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-7 bg-muted/20 border-b border-border/40">
                                {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                                    <div key={idx} className="text-center py-2 sm:py-3 text-xs sm:text-sm font-semibold text-muted-foreground border-r border-border/40 last:border-r-0 sm:hidden">
                                        {day}
                                    </div>
                                ))}
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                    <div key={day} className="text-center py-2 sm:py-3 text-xs sm:text-sm font-semibold text-muted-foreground border-r border-border/40 last:border-r-0 hidden sm:block">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7">
                                {renderCalendarDays()}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
