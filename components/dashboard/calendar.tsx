"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Edit, Trash2, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Event {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    date: string; // YYYY-MM-DD
    time?: string;
    color: string;
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
    const [newEventTitle, setNewEventTitle] = useState("");
    const [newEventDescription, setNewEventDescription] = useState("");
    const [newEventDate, setNewEventDate] = useState("");
    const [newEventTime, setNewEventTime] = useState("");
    const [newEventColor, setNewEventColor] = useState("bg-blue-500");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewEventDialog, setViewEventDialog] = useState(false);
    const [userId, setUserId] = useState<string>("");
    const [loading, setLoading] = useState(false);

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
        }
    }, [userId]);

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

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] border-r border-b border-border/40 bg-muted/5"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
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

                    {/* View Event Dialog */}
                    <Dialog open={viewEventDialog} onOpenChange={setViewEventDialog}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${selectedEvent?.color}`} />
                                    {selectedEvent?.title}
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
                                </div>
                            )}
                            <DialogFooter className="flex gap-2 sm:justify-between">
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
