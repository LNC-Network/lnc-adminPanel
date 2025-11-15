"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  MessageSquare,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  created_by_user?: {
    id: string;
    email: string;
    display_name?: string;
  };
  ticket_assignments?: Array<{
    id: string;
    assigned_user: {
      id: string;
      email: string;
      display_name?: string;
    };
  }>;
}

interface User {
  id: string;
  email: string;
  display_name?: string;
}

interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    display_name?: string;
  };
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Create ticket form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  
  // Assignment
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUserId(user.id || "");
          setIsAdmin(user.roles?.includes("admin") || false);
        } catch (e) {
          console.error("Failed to parse user data:", e);
        }
      }
    }
    fetchTickets();
    fetchUsers();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
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

  const fetchComments = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/tickets/comments?ticket_id=${ticketId}`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          priority: newPriority,
          created_by: currentUserId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Ticket created successfully");
        setCreateDialogOpen(false);
        setNewTitle("");
        setNewDescription("");
        setNewPriority("medium");
        fetchTickets();
      } else {
        toast.error(data.error || "Failed to create ticket");
      }
    } catch (error) {
      toast.error("Failed to create ticket");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticketId,
          status: newStatus,
        }),
      });

      if (res.ok) {
        toast.success("Status updated");
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          const updated = tickets.find(t => t.id === ticketId);
          if (updated) setSelectedTicket({ ...updated, status: newStatus });
        }
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  const handleAssignUsers = async () => {
    if (!selectedTicket || selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      const res = await fetch("/api/tickets/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: selectedTicket.id,
          user_ids: selectedUsers,
          assigned_by: currentUserId,
        }),
      });

      if (res.ok) {
        toast.success("Users assigned successfully");
        setAssignDialogOpen(false);
        setSelectedUsers([]);
        fetchTickets();
      } else {
        toast.error("Failed to assign users");
      }
    } catch (error) {
      toast.error("Failed to assign users");
      console.error(error);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !newComment.trim()) return;

    try {
      const res = await fetch("/api/tickets/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: selectedTicket.id,
          user_id: currentUserId,
          comment: newComment,
        }),
      });

      if (res.ok) {
        setNewComment("");
        fetchComments(selectedTicket.id);
        toast.success("Comment added");
      } else {
        toast.error("Failed to add comment");
      }
    } catch (error) {
      toast.error("Failed to add comment");
      console.error(error);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;

    try {
      const res = await fetch(`/api/tickets?ticket_id=${ticketId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Ticket deleted");
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          setDetailDialogOpen(false);
        }
      } else {
        toast.error("Failed to delete ticket");
      }
    } catch (error) {
      toast.error("Failed to delete ticket");
      console.error(error);
    }
  };

  const openTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchComments(ticket.id);
    setDetailDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      case "closed": return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100";
      case "in_progress": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100";
      case "resolved": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100";
      case "closed": return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-100";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100";
      case "high": return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100";
      case "medium": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100";
      case "low": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const filteredTickets = filterStatus === "all" 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Ticket System</h2>
            <p className="text-muted-foreground">Manage and track issues</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.open}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>All Tickets</CardTitle>
                <CardDescription>View and manage all tickets</CardDescription>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No tickets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow 
                        key={ticket.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openTicketDetails(ticket)}
                      >
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(ticket.status)}
                              {ticket.status.replace("_", " ")}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ticket.ticket_assignments && ticket.ticket_assignments.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span className="text-sm">
                                {ticket.ticket_assignments.length} user(s)
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {ticket.created_by_user?.display_name || ticket.created_by_user?.email || "Unknown"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openTicketDetails(ticket);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create Ticket Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>
                Create a new ticket to track an issue or task
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the issue"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTicket} disabled={loading}>
                {loading ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Ticket Details Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            {selectedTicket && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <DialogTitle className="text-xl">{selectedTicket.title}</DialogTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(selectedTicket.status)}>
                          {selectedTicket.status.replace("_", " ")}
                        </Badge>
                        <Badge className={getPriorityColor(selectedTicket.priority)}>
                          {selectedTicket.priority}
                        </Badge>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteTicket(selectedTicket.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Description */}
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {/* Status Update */}
                  {isAdmin && (
                    <div>
                      <h4 className="font-semibold mb-2">Update Status</h4>
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Assigned Users */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Assigned To</h4>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAssignDialogOpen(true)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {selectedTicket.ticket_assignments && selectedTicket.ticket_assignments.length > 0 ? (
                        selectedTicket.ticket_assignments.map((assignment) => (
                          <div key={assignment.id} className="text-sm flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            {assignment.assigned_user.display_name || assignment.assigned_user.email}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No one assigned yet</p>
                      )}
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comments ({comments.length})
                    </h4>
                    <div className="space-y-3 mb-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {comment.user?.display_name || comment.user?.email || "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <p className="text-sm text-muted-foreground">No comments yet</p>
                      )}
                    </div>
                    {/* Add Comment */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                      />
                      <Button onClick={handleAddComment} size="sm">
                        Add Comment
                      </Button>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                    <p>Created by: {selectedTicket.created_by_user?.display_name || selectedTicket.created_by_user?.email}</p>
                    <p>Created: {new Date(selectedTicket.created_at).toLocaleString()}</p>
                    <p>Last updated: {new Date(selectedTicket.updated_at).toLocaleString()}</p>
                    {selectedTicket.closed_at && (
                      <p>Closed: {new Date(selectedTicket.closed_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Assign Users Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Users</DialogTitle>
              <DialogDescription>
                Select users to assign to this ticket
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-2 p-3 hover:bg-muted cursor-pointer"
                    onClick={() => {
                      setSelectedUsers(prev =>
                        prev.includes(user.id)
                          ? prev.filter(id => id !== user.id)
                          : [...prev, user.id]
                      );
                    }}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => {
                        setSelectedUsers(prev =>
                          prev.includes(user.id)
                            ? prev.filter(id => id !== user.id)
                            : [...prev, user.id]
                        );
                      }}
                    />
                    <Label className="flex-1 cursor-pointer">
                      {user.display_name || user.email}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignUsers}>
                Assign Selected
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
