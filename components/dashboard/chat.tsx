"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Plus, Users, MoreVertical, Search, Phone, Video, Bell, CheckCircle, XCircle } from "lucide-react";
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check if user is admin
        if (typeof window !== "undefined") {
            const userData = localStorage.getItem("user");
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    const adminStatus = user.roles?.includes("admin") || false;
                    setIsAdmin(adminStatus);
                    setCurrentUserId(user.id || "");
                    
                    // Fetch join requests if admin
                    if (adminStatus) {
                        fetchJoinRequests();
                        // Poll for new join requests every 10 seconds
                        const interval = setInterval(fetchJoinRequests, 10000);
                        return () => clearInterval(interval);
                    }
                } catch (e) {
                    console.error("Failed to parse user data:", e);
                }
            }
        }
        fetchGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            fetchMessages(selectedGroup.id);
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
            const res = await fetch("/api/chat/groups");
            const data = await res.json();
            if (res.ok) {
                setGroups(data.groups || []);
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

            const res = await fetch(`/api/chat/messages?group_id=${groupId}&user_id=${user.id}`);
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

            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    group_id: selectedGroup.id,
                    user_id: user.id,
                    message: newMessage,
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
            <div className="flex h-[calc(100vh-8rem)] gap-4">
                {/* Groups Sidebar */}
                <Card className="w-80 flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h2 className="font-semibold text-lg">Groups</h2>
                        <div className="flex gap-2">
                            {isAdmin && (
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                        fetchJoinRequests();
                                        setJoinRequestsOpen(true);
                                    }}
                                >
                                    <Bell className="h-4 w-4 mr-1" />
                                    {joinRequests.length > 0 && (
                                        <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                                            {joinRequests.length}
                                        </Badge>
                                    )}
                                </Button>
                            )}
                            {isAdmin && (
                                <Button size="sm" onClick={openCreateGroupDialog}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    New
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
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>
                                            <Users className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate">{group.name}</h3>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {group.description || "No description"}
                                        </p>
                                    </div>
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
                <Card className="flex-1 flex flex-col">
                    {selectedGroup ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>
                                            <Users className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">{selectedGroup.name}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedGroup.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {isAdmin && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={openAddMembersDialog}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Members
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon">
                                        <Phone className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <Video className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                                <form onSubmit={handleSendMessage} className="p-4 border-t">
                                    <div className="flex gap-2">
                                        <Input
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1"
                                        />
                                        <Button type="submit" size="icon">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            Select a group to start chatting
                        </div>
                    )}
                </Card>

                {/* Create Group Dialog */}
                <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                    <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
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
                                <div className="border rounded-md max-h-60 overflow-y-auto">
                                    {filteredUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center space-x-2 p-3 hover:bg-muted cursor-pointer"
                                            onClick={() => toggleUserSelection(user.id)}
                                        >
                                            <Checkbox
                                                checked={selectedUsers.includes(user.id)}
                                                onCheckedChange={() => toggleUserSelection(user.id)}
                                            />
                                            <Label className="flex-1 cursor-pointer">
                                                {user.email}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setCreateGroupOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleCreateGroup}>Create Group</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add Members Dialog */}
                <Dialog open={addMembersOpen} onOpenChange={setAddMembersOpen}>
                    <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add Members</DialogTitle>
                            <DialogDescription>
                                Add members to {selectedGroup?.name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="border rounded-md max-h-60 overflow-y-auto">
                                {filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center space-x-2 p-3 hover:bg-muted cursor-pointer"
                                        onClick={() => toggleUserSelection(user.id)}
                                    >
                                        <Checkbox
                                            checked={selectedUsers.includes(user.id)}
                                            onCheckedChange={() => toggleUserSelection(user.id)}
                                        />
                                        <Label className="flex-1 cursor-pointer">
                                            {user.email}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setAddMembersOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleAddMembers}>Add Members</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Join Requests Dialog */}
                <Dialog open={joinRequestsOpen} onOpenChange={setJoinRequestsOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Join Requests</DialogTitle>
                            <DialogDescription>
                                Manage user requests to join groups
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-4">
                            {joinRequests.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No pending join requests
                                </div>
                            ) : (
                                joinRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50"
                                    >
                                        <div className="flex-1">
                                            <p className="font-semibold">{request.user_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {request.user_email}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                wants to join <span className="font-medium">{request.group_name}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(request.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleApproveRequest(request.id)}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRejectRequest(request.id)}
                                            >
                                                <XCircle className="h-4 w-4 mr-1 text-red-600" />
                                                Reject
                                            </Button>
                                        </div>
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
