"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Plus, Users, MoreVertical, Search, Phone, Video, Bell, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface Message {
    id: string;
    group_id: string;
    user_id: string;
    message: string;
    created_at: string;
    user_email?: string;
}

interface Group {
    id: string;
    name: string;
    description?: string;
    created_by: string;
    created_at: string;
    member_count?: number;
    unseen_count?: number;
}

interface User {
    id: string;
    email: string;
}

interface JoinRequest {
    id: string;
    group_id: string;
    group_name: string;
    user_id: string;
    user_name: string;
    user_email: string;
    status: string;
    created_at: string;
}

interface GroupMember {
    user_id: string;
    email: string;
    joined_at: string;
}

export default function ChatPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [createGroupOpen, setCreateGroupOpen] = useState(false);
    const [addMembersOpen, setAddMembersOpen] = useState(false);
    const [joinRequestsOpen, setJoinRequestsOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUserId, setCurrentUserId] = useState("");
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [hasAccess, setHasAccess] = useState(true);
    const [viewMembersOpen, setViewMembersOpen] = useState(false);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [totalUnseenCount, setTotalUnseenCount] = useState(0);
    const [showGroupsSidebar, setShowGroupsSidebar] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check if user is admin
        if (typeof window !== "undefined") {
            const userData = localStorage.getItem("user");
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    const adminStatus = user.roles?.some((role: string) => role.toLowerCase().includes('admin')) || false;
                    setIsAdmin(adminStatus);
                    setCurrentUserId(user.id || "");

                    // Fetch join requests if admin
                    if (adminStatus) {
                        fetchJoinRequests();
                        // Poll for new join requests every 10 seconds
                        const joinInterval = setInterval(fetchJoinRequests, 10000);
                        // Poll for unseen counts every 10 seconds
                        const unseenInterval = setInterval(fetchUnseenCounts, 10000);
                        return () => {
                            clearInterval(joinInterval);
                            clearInterval(unseenInterval);
                        };
                    } else {
                        // Non-admins also need to poll for unseen counts
                        const unseenInterval = setInterval(fetchUnseenCounts, 10000);
                        return () => clearInterval(unseenInterval);
                    }
                } catch (e) {
                    console.error("Failed to parse user data:", e);
                }
            }
        }
        fetchGroups();
        fetchUnseenCounts();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            fetchMessages(selectedGroup.id);
            markMessagesAsSeen(selectedGroup.id);
            // Poll for new messages every 3 seconds
            const interval = setInterval(() => {
                fetchMessages(selectedGroup.id);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedGroup]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchGroups = async () => {
        try {
            const userData = localStorage.getItem("user");
            if (!userData) {
                console.log("No user data in localStorage");
                return;
            }
            const user = JSON.parse(userData);
            console.log("Current user:", user.id, user.email);
            const userIsAdmin = user.roles?.some((role: string) => role.toLowerCase().includes('admin')) || false;

            const url = `/api/chat/groups?user_id=${user.id}&is_admin=${userIsAdmin}`;
            console.log("Fetching groups from:", url);
            const res = await fetch(url);
            const data = await res.json();
            console.log("Groups response:", { status: res.status, data });
            if (res.ok) {
                setGroups(data.groups || []);
            } else {
                console.error("Failed to fetch groups:", data);
            }
        } catch (error) {
            console.error("Failed to fetch groups:", error);
        }
    };

    const fetchMessages = async (groupId: string) => {
        try {
            const userData = localStorage.getItem("user");
            if (!userData) return;
            const user = JSON.parse(userData);
            const userIsAdmin = user.roles?.some((role: string) => role.toLowerCase().includes('admin')) || false;

            const res = await fetch(`/api/chat/messages?group_id=${groupId}&user_id=${user.id}&is_admin=${userIsAdmin}`);
            const data = await res.json();
            if (res.ok) {
                setMessages(data.messages || []);
                setHasAccess(true);
            } else {
                if (res.status === 403) {
                    setMessages([]);
                    setHasAccess(false);
                }
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users/list");
            const data = await res.json();
            if (res.ok) {
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            toast.error("Group name is required");
            return;
        }

        try {
            const res = await fetch("/api/chat/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: groupName,
                    description: groupDescription,
                    member_ids: selectedUsers,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Group created successfully");
                setCreateGroupOpen(false);
                setGroupName("");
                setGroupDescription("");
                setSelectedUsers([]);
                fetchGroups();
            } else {
                toast.error(data.error || "Failed to create group");
            }
        } catch (error) {
            toast.error("Failed to create group");
            console.error(error);
        }
    };

    const handleAddMembers = async () => {
        if (!selectedGroup || selectedUsers.length === 0) {
            toast.error("Please select users to add");
            return;
        }

        try {
            const res = await fetch("/api/chat/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    group_id: selectedGroup.id,
                    user_ids: selectedUsers,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Members added successfully");
                setAddMembersOpen(false);
                setSelectedUsers([]);
            } else {
                toast.error(data.error || "Failed to add members");
            }
        } catch (error) {
            toast.error("Failed to add members");
            console.error(error);
        }
    };

    const fetchUnseenCounts = async () => {
        try {
            const userData = localStorage.getItem("user");
            if (!userData) return;
            const user = JSON.parse(userData);

            const res = await fetch(`/api/chat/unseen?user_id=${user.id}`);
            const data = await res.json();
            if (res.ok) {
                setTotalUnseenCount(data.total_unseen || 0);

                // Update groups with unseen counts
                const unseenByGroup = data.groups?.reduce((acc: any, g: any) => {
                    acc[g.group_id] = g.unseen_count;
                    return acc;
                }, {}) || {};

                setGroups(prev => prev.map(group => ({
                    ...group,
                    unseen_count: unseenByGroup[group.id] || 0
                })));

                // Emit unseen count for dashboard
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('chatUnseenCount', {
                        detail: { count: data.total_unseen || 0 }
                    }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch unseen counts:", error);
        }
    };

    const markMessagesAsSeen = async (groupId: string) => {
        try {
            const userData = localStorage.getItem("user");
            if (!userData) return;
            const user = JSON.parse(userData);

            await fetch('/api/chat/unseen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    group_id: groupId,
                }),
            });

            // Refresh unseen counts after marking as seen
            setTimeout(fetchUnseenCounts, 500);
        } catch (error) {
            console.error("Failed to mark messages as seen:", error);
        }
    };

    const fetchGroupMembers = async (groupId: string) => {
        try {
            const res = await fetch(`/api/chat/members?group_id=${groupId}`);
            if (res.ok) {
                const data = await res.json();
                setGroupMembers(data.members || []);
            } else {
                toast.error("Failed to fetch members");
            }
        } catch (error) {
            toast.error("Failed to fetch members");
            console.error(error);
        }
    };

    const handleRemoveMember = async (userId: string, userEmail: string) => {
        if (!selectedGroup) return;

        const confirmed = window.confirm(`Are you sure you want to remove ${userEmail} from this group?`);
        if (!confirmed) return;

        try {
            const res = await fetch("/api/chat/members", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    group_id: selectedGroup.id,
                    user_id: userId,
                }),
            });

            if (res.ok) {
                toast.success("Member removed successfully");
                fetchGroupMembers(selectedGroup.id);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to remove member");
            }
        } catch (error) {
            toast.error("Failed to remove member");
            console.error(error);
        }
    };

    const openViewMembersDialog = () => {
        if (selectedGroup) {
            fetchGroupMembers(selectedGroup.id);
            setViewMembersOpen(true);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedGroup) return;

        try {
            const userData = localStorage.getItem("user");
            if (!userData) {
                toast.error("User not logged in");
                return;
            }
            const user = JSON.parse(userData);
            const userIsAdmin = user.roles?.some((role: string) => role.toLowerCase().includes('admin')) || false;

            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    group_id: selectedGroup.id,
                    user_id: user.id,
                    message: newMessage,
                    is_admin: userIsAdmin,
                }),
            });

            if (res.ok) {
                setNewMessage("");
                fetchMessages(selectedGroup.id);
            } else {
                toast.error("Failed to send message");
            }
        } catch (error) {
            toast.error("Failed to send message");
            console.error(error);
        }
    };

    const openCreateGroupDialog = () => {
        fetchUsers();
        setCreateGroupOpen(true);
    };

    const openAddMembersDialog = () => {
        fetchUsers();
        setAddMembersOpen(true);
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const fetchJoinRequests = async () => {
        try {
            const res = await fetch("/api/chat/join-requests");
            const data = await res.json();
            if (res.ok) {
                setJoinRequests(data.requests || []);
            }
        } catch (error) {
            console.error("Failed to fetch join requests:", error);
        }
    };

    const handleJoinRequest = async () => {
        if (!selectedGroup || !currentUserId) return;

        try {
            const res = await fetch("/api/chat/join-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    group_id: selectedGroup.id,
                    user_id: currentUserId,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Join request sent successfully");
            } else {
                toast.error(data.error || "Failed to send join request");
            }
        } catch (error) {
            toast.error("Failed to send join request");
            console.error(error);
        }
    };

    const handleApproveRequest = async (requestId: string) => {
        try {
            const res = await fetch("/api/chat/join-requests", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    request_id: requestId,
                    action: "approve",
                }),
            });

            if (res.ok) {
                toast.success("Request approved");
                fetchJoinRequests();
            } else {
                toast.error("Failed to approve request");
            }
        } catch (error) {
            toast.error("Failed to approve request");
            console.error(error);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            const res = await fetch("/api/chat/join-requests", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    request_id: requestId,
                    action: "reject",
                }),
            });

            if (res.ok) {
                toast.success("Request rejected");
                fetchJoinRequests();
            } else {
                toast.error("Failed to reject request");
            }
        } catch (error) {
            toast.error("Failed to reject request");
            console.error(error);
        }
    };

    const filteredUsers = users.filter((user) =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <Toaster position="top-center" richColors closeButton />
            <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-2 sm:gap-4">
                {/* Groups Sidebar */}
                <Card className={`w-full lg:w-80 flex flex-col ${selectedGroup ? 'hidden lg:flex' : 'flex'
                    }`}>
                    <div className="p-3 sm:p-4 border-b flex justify-between items-center">
                        <h2 className="font-semibold text-base sm:text-lg">Groups</h2>
                        <div className="flex gap-1 sm:gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    fetchGroups();
                                    toast.success('Groups refreshed');
                                }}
                                title="Refresh groups"
                                className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        fetchJoinRequests();
                                        setJoinRequestsOpen(true);
                                    }}
                                    className="h-8 px-2 sm:h-9 sm:px-3"
                                >
                                    <Bell className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Requests</span>
                                    {joinRequests.length > 0 && (
                                        <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                                            {joinRequests.length}
                                        </Badge>
                                    )}
                                </Button>
                            )}
                            {isAdmin && (
                                <Button size="sm" onClick={openCreateGroupDialog} className="h-8 px-2 sm:h-9 sm:px-3">
                                    <Plus className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">New</span>
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                onClick={() => setSelectedGroup(group)}
                                className={`p-4 border-b cursor-pointer hover:bg-muted transition-colors ${selectedGroup?.id === group.id ? "bg-muted" : ""
                                    }`}
                            >
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                                        <AvatarFallback>
                                            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate text-sm sm:text-base">{group.name}</h3>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {group.description || "No description"}
                                        </p>
                                    </div>
                                    {group.unseen_count && group.unseen_count > 0 && (
                                        <div className="flex-shrink-0">
                                            <div className="bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
                                                {group.unseen_count > 9 ? '9+' : group.unseen_count}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {groups.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                No groups yet
                            </div>
                        )}
                    </div>
                </Card>

                {/* Chat Area */}
                <Card className={`flex-1 flex flex-col min-h-0 ${!selectedGroup ? 'hidden lg:flex' : 'flex'
                    }`}>
                    {selectedGroup ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-3 sm:p-4 border-b flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="lg:hidden h-8 w-8 flex-shrink-0"
                                        onClick={() => {
                                            setSelectedGroup(null);
                                            setShowGroupsSidebar(true);
                                        }}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </Button>
                                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                                        <AvatarFallback>
                                            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-sm sm:text-base truncate">{selectedGroup.name}</h3>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {selectedGroup.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                    {isAdmin && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={openViewMembersDialog}
                                                className="hidden sm:flex h-8 px-2 sm:h-9 sm:px-3"
                                            >
                                                <Users className="h-4 w-4 sm:mr-1" />
                                                <span className="hidden md:inline">View Members</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={openAddMembersDialog}
                                                className="h-8 px-2 sm:h-9 sm:px-3"
                                            >
                                                <Plus className="h-4 w-4 sm:mr-1" />
                                                <span className="hidden md:inline">Add</span>
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9">
                                        <Phone className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9">
                                        <Video className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                                {hasAccess ? (
                                    <>
                                        {messages.map((message) => {
                                            const isOwnMessage = message.user_id === currentUserId;
                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"
                                                        }`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] ${isOwnMessage
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted"
                                                            } rounded-lg p-3`}
                                                    >
                                                        {!isOwnMessage && (
                                                            <p className="text-xs font-semibold mb-1 opacity-90">
                                                                {(message as any).user_name}
                                                            </p>
                                                        )}
                                                        <p className="text-sm">{message.message}</p>
                                                        <p
                                                            className={`text-xs mt-1 ${isOwnMessage
                                                                ? "text-primary-foreground/70"
                                                                : "text-muted-foreground"
                                                                }`}
                                                        >
                                                            {new Date(message.created_at).toLocaleTimeString([], {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                        <Users className="h-16 w-16 text-muted-foreground mb-4" />
                                        <h3 className="font-semibold text-lg mb-2">You're not a member of this group</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Send a join request to the admin to access this group
                                        </p>
                                        <Button onClick={handleJoinRequest}>
                                            Send Join Request
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Message Input */}
                            {hasAccess && (
                                <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t">
                                    <div className="flex gap-2">
                                        <Input
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 text-sm sm:text-base"
                                        />
                                        <Button type="submit" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm sm:text-base p-4 text-center">
                            Select a group to start chatting
                        </div>
                    )}
                </Card>

                {/* Create Group Dialog */}
                <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                    <DialogContent className="sm:max-w-[500px] max-h-[85vh] sm:max-h-[80vh] overflow-y-auto mx-4">
                        <DialogHeader>
                            <DialogTitle>Create New Group</DialogTitle>
                            <DialogDescription>
                                Create a group and add members
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="group-name">Group Name</Label>
                                <Input
                                    id="group-name"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Enter group name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="group-desc">Description (optional)</Label>
                                <Input
                                    id="group-desc"
                                    value={groupDescription}
                                    onChange={(e) => setGroupDescription(e.target.value)}
                                    placeholder="Enter group description"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Add Members</Label>
                                <Input
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="mb-2"
                                />
                                <div className="border rounded-md max-h-48 sm:max-h-60 overflow-y-auto">
                                    {filteredUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center space-x-2 p-2 sm:p-3 hover:bg-muted active:bg-muted/80 cursor-pointer"
                                            onClick={() => toggleUserSelection(user.id)}
                                        >
                                            <Checkbox
                                                checked={selectedUsers.includes(user.id)}
                                                onCheckedChange={() => toggleUserSelection(user.id)}
                                            />
                                            <Label className="flex-1 cursor-pointer text-sm sm:text-base truncate">
                                                {user.email}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 sm:gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setCreateGroupOpen(false)}
                                className="h-9 sm:h-10"
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleCreateGroup} className="h-9 sm:h-10">Create Group</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add Members Dialog */}
                <Dialog open={addMembersOpen} onOpenChange={setAddMembersOpen}>
                    <DialogContent className="sm:max-w-[500px] max-h-[85vh] sm:max-h-[80vh] overflow-y-auto mx-4">
                        <DialogHeader>
                            <DialogTitle>Add Members</DialogTitle>
                            <DialogDescription>
                                Add members to {selectedGroup?.name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2 sm:py-4">
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="border rounded-md max-h-48 sm:max-h-60 overflow-y-auto">
                                {filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center space-x-2 p-2 sm:p-3 hover:bg-muted active:bg-muted/80 cursor-pointer"
                                        onClick={() => toggleUserSelection(user.id)}
                                    >
                                        <Checkbox
                                            checked={selectedUsers.includes(user.id)}
                                            onCheckedChange={() => toggleUserSelection(user.id)}
                                        />
                                        <Label className="flex-1 cursor-pointer text-sm sm:text-base truncate">
                                            {user.email}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 sm:gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setAddMembersOpen(false)}
                                className="h-9 sm:h-10"
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleAddMembers} className="h-9 sm:h-10">Add Members</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Join Requests Dialog */}
                <Dialog open={joinRequestsOpen} onOpenChange={setJoinRequestsOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[85vh] sm:max-h-[80vh] overflow-y-auto mx-4">
                        <DialogHeader>
                            <DialogTitle>Join Requests</DialogTitle>
                            <DialogDescription>
                                Manage user requests to join groups
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2 sm:py-4">
                            {joinRequests.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
                                    No pending join requests
                                </div>
                            ) : (
                                joinRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="border rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/50"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm sm:text-base">{request.user_name}</p>
                                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                                {request.user_email}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                wants to join <span className="font-medium">{request.group_name}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(request.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleApproveRequest(request.id)}
                                                className="flex-1 sm:flex-none h-9"
                                            >
                                                <CheckCircle className="h-4 w-4 sm:mr-1 text-green-600" />
                                                <span className="hidden sm:inline">Approve</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRejectRequest(request.id)}
                                                className="flex-1 sm:flex-none h-9"
                                            >
                                                <XCircle className="h-4 w-4 sm:mr-1 text-red-600" />
                                                <span className="hidden sm:inline">Reject</span>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* View Members Dialog */}
                <Dialog open={viewMembersOpen} onOpenChange={setViewMembersOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[85vh] sm:max-h-[80vh] overflow-y-auto mx-4">
                        <DialogHeader>
                            <DialogTitle>Group Members</DialogTitle>
                            <DialogDescription>
                                {selectedGroup?.name} - Manage group members
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2 sm:py-4">
                            {groupMembers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
                                    No members in this group
                                </div>
                            ) : (
                                groupMembers.map((member) => (
                                    <div
                                        key={member.user_id}
                                        className="border rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/50"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm sm:text-base truncate">{member.email}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Joined {new Date(member.joined_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleRemoveMember(member.user_id, member.email)}
                                            className="w-full sm:w-auto h-9"
                                        >
                                            <XCircle className="h-4 w-4 sm:mr-1" />
                                            <span className="hidden sm:inline">Remove</span>
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
