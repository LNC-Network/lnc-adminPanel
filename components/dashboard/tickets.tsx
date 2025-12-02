"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  TableRow,
} from "@/components/ui/table";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

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
  Trash2,
} from "lucide-react";

import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

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

  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // -------------------------------------------------------------
  // INIT
  // -------------------------------------------------------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("user");
      if (data) {
        try {
          const user = JSON.parse(data);
          setCurrentUserId(user.id || "");
          // Check for admin roles (case-insensitive)
          const userRoles = (user.roles || []).map((r: string) => r.toLowerCase());
          const hasAdminAccess = userRoles.includes("super admin") ||
            userRoles.includes("dev team admin") ||
            userRoles.includes("admin");
          setIsAdmin(hasAdminAccess);
        } catch { }
      }
    }
    fetchTickets();
    fetchUsers();
  }, []);

  // -------------------------------------------------------------
  // FETCH
  // -------------------------------------------------------------
  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (res.ok) setTickets(data.tickets || []);
    } catch { }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users/list");
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch { }
  };

  const fetchComments = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/tickets/comments?ticket_id=${ticketId}`);
      const data = await res.json();
      if (res.ok) setComments(data.comments || []);
    } catch { }
  };

  // -------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------
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
        toast.success("Ticket created");
        setCreateOpen(false);
        setNewTitle("");
        setNewDescription("");
        setNewPriority("medium");
        fetchTickets();
      } else {
        toast.error(data.error || "Failed to create");
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // UPDATE STATUS
  // -------------------------------------------------------------
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: id, status }),
      });

      if (res.ok) {
        toast.success("Status updated");
        fetchTickets();

        if (selectedTicket && selectedTicket.id === id) {
          setSelectedTicket((prev) => (prev ? { ...prev, status } : prev));
        }
      } else toast.error("Failed");
    } catch {
      toast.error("Failed");
    }
  };

  // -------------------------------------------------------------
  // ASSIGN USERS
  // -------------------------------------------------------------
  const handleAssignUsers = async () => {
    if (!selectedTicket || selectedUsers.length === 0) {
      toast.error("Select at least one user");
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
        toast.success("Assigned");
        setAssignOpen(false);
        setSelectedUsers([]);
        fetchTickets();
      } else toast.error("Failed");
    } catch {
      toast.error("Failed");
    }
  };

  // -------------------------------------------------------------
  // COMMENTS
  // -------------------------------------------------------------
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
      } else toast.error("Failed");
    } catch {
      toast.error("Failed");
    }
  };

  // -------------------------------------------------------------
  // REMOVE
  // -------------------------------------------------------------
  const handleDeleteTicket = async (id: string) => {
    if (!confirm("Delete ticket?")) return;

    try {
      const res = await fetch(`/api/tickets?ticket_id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Deleted");
        fetchTickets();
        if (selectedTicket?.id === id) setDetailsOpen(false);
      } else toast.error("Failed");
    } catch {
      toast.error("Failed");
    }
  };

  // -------------------------------------------------------------
  // Open ticket
  // -------------------------------------------------------------
  const openTicketDetails = (t: Ticket) => {
    setSelectedTicket(t);
    fetchComments(t.id);
    setDetailsOpen(true);
  };

  // -------------------------------------------------------------
  // Colors
  // -------------------------------------------------------------
  const statusColor = (s: string) => {
    switch (s) {
      case "open":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-300";
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-300";
      case "resolved":
        return "bg-green-500/10 text-green-600 dark:text-green-300";
      case "closed":
        return "bg-gray-500/10 text-gray-600 dark:text-gray-300";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "critical":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-300";
      case "high":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-300";
      case "medium":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-300";
      case "low":
        return "bg-green-500/10 text-green-600 dark:text-green-300";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const filtered =
    filterStatus === "all"
      ? tickets
      : tickets.filter((t) => t.status === filterStatus);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------
  return (
    <>
      <Toaster position="top-center" richColors closeButton />

      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-4 lg:px-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Ticket System</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Manage and track issues</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="rounded-lg w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </Button>
        </div>

        {/* STATS */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats.open}</div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* TABLE */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tickets</CardTitle>
              <CardDescription>View and manage all tickets</CardDescription>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>

          <CardContent>
            <div className="rounded-xl border border-border/40 overflow-auto">
              <Table className="min-w-full">
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No tickets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((t) => (
                      <TableRow
                        key={t.id}
                        className="hover:bg-muted/50 even:bg-muted/30 cursor-pointer"
                        onClick={() => openTicketDetails(t)}
                      >
                        <TableCell className="font-medium">{t.title}</TableCell>

                        <TableCell>
                          <Badge
                            className={`rounded-full px-3 py-1 text-xs ${statusColor(
                              t.status
                            )}`}
                          >
                            {t.status.replace("_", " ")}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={`rounded-full px-3 py-1 text-xs ${priorityColor(
                              t.priority
                            )}`}
                          >
                            {t.priority}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {t.ticket_assignments?.length ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="h-3 w-3" />
                              {t.ticket_assignments.length} user(s)
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Unassigned
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-sm">
                          {t.created_by_user?.display_name ||
                            t.created_by_user?.email ||
                            "Unknown"}
                        </TableCell>

                        <TableCell className="text-sm">
                          {new Date(t.created_at).toLocaleDateString()}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openTicketDetails(t);
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

        {/* ======================================================= */}
        {/* CREATE TICKET SHEET */}
        {/* ======================================================= */}
        <Sheet open={createOpen} onOpenChange={setCreateOpen}>
          <SheetContent
            side="right"
            className="w-full sm:w-[480px] space-y-6 overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>Create Ticket</SheetTitle>
              <SheetDescription>Create a new issue or task</SheetDescription>
            </SheetHeader>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Brief summary"
                />
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  rows={5}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detailed description"
                />
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger>
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

              <Button
                onClick={handleCreateTicket}
                className="w-full rounded-lg"
              >
                {loading ? "Creating..." : "Create"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* ======================================================= */}
        {/* TICKET DETAILS SHEET */}
        {/* ======================================================= */}
        <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
          <SheetContent
            side="right"
            className="w-full sm:w-[520px] overflow-y-auto"
          >
            {selectedTicket && (
              <div className="space-y-8 py-4">
                <SheetHeader>
                  <SheetTitle className="text-xl">
                    {selectedTicket.title}
                  </SheetTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge
                      className={`rounded-full px-3 py-1 ${statusColor(
                        selectedTicket.status
                      )}`}
                    >
                      {selectedTicket.status.replace("_", " ")}
                    </Badge>
                    <Badge
                      className={`rounded-full px-3 py-1 ${priorityColor(
                        selectedTicket.priority
                      )}`}
                    >
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                </SheetHeader>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Status Update */}
                {isAdmin && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Update Status</h4>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(v) =>
                        handleUpdateStatus(selectedTicket.id, v)
                      }
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

                {/* Assignments */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Assigned To</h4>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignOpen(true)}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    )}
                  </div>

                  {selectedTicket.ticket_assignments?.length ? (
                    selectedTicket.ticket_assignments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Users className="h-3 w-3" />
                        {a.assigned_user.display_name || a.assigned_user.email}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No users assigned
                    </p>
                  )}
                </div>

                {/* Comments */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comments ({comments.length})
                  </h4>

                  <div className="space-y-3">
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-border/40 bg-muted/40 p-4 shadow-sm"
                      >
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">
                            {c.user?.display_name || c.user?.email || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {c.comment}
                        </p>
                      </div>
                    ))}

                    {comments.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No comments yet
                      </p>
                    )}
                  </div>

                  {/* Add comment */}
                  <div className="space-y-2">
                    <Textarea
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment"
                    />
                    <Button size="sm" onClick={handleAddComment}>
                      Add Comment
                    </Button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-xs text-muted-foreground border-t border-border/40 pt-4 space-y-1">
                  <p>
                    Created by:{" "}
                    {selectedTicket.created_by_user?.display_name ||
                      selectedTicket.created_by_user?.email}
                  </p>
                  <p>
                    Created:{" "}
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </p>
                  <p>
                    Updated:{" "}
                    {new Date(selectedTicket.updated_at).toLocaleString()}
                  </p>
                  {selectedTicket.closed_at && (
                    <p>
                      Closed:{" "}
                      {new Date(selectedTicket.closed_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Delete */}
                {isAdmin && (
                  <Button
                    variant="destructive"
                    className="rounded-lg w-full"
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Ticket
                  </Button>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* ======================================================= */}
        {/* ASSIGN USERS SHEET */}
        {/* ======================================================= */}
        <Sheet open={assignOpen} onOpenChange={setAssignOpen}>
          <SheetContent
            side="right"
            className="w-full sm:w-[420px] space-y-6 overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>Assign Users</SheetTitle>
              <SheetDescription>Select users to assign</SheetDescription>
            </SheetHeader>

            <div className="space-y-4">
              <div className="rounded-xl border border-border/40 max-h-72 overflow-y-auto">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                    onClick={() =>
                      setSelectedUsers((prev) =>
                        prev.includes(u.id)
                          ? prev.filter((i) => i !== u.id)
                          : [...prev, u.id]
                      )
                    }
                  >
                    <Checkbox
                      checked={selectedUsers.includes(u.id)}
                      onCheckedChange={() =>
                        setSelectedUsers((prev) =>
                          prev.includes(u.id)
                            ? prev.filter((i) => i !== u.id)
                            : [...prev, u.id]
                        )
                      }
                    />
                    <Label>{u.display_name || u.email}</Label>
                  </div>
                ))}
              </div>

              <Button className="w-full rounded-lg" onClick={handleAssignUsers}>
                Assign Selected
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
