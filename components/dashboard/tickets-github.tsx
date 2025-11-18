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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Plus,
  MessageSquare,
  Tag,
  Milestone as MilestoneIcon,
  X,
  Circle,
  CheckCircle2,
  Lock,
  Unlock,
  Search,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Heart,
  PartyPopper,
  Rocket,
  Eye,
  Smile,
  AlertCircle,
  Calendar,
  Users,
} from "lucide-react";

import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

// Types
interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  state: string;
  created_at: string;
  closed_at?: string;
}

interface Ticket {
  id: string;
  issue_number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  closed_by?: string;
  is_locked: boolean;
  milestone_id?: string;
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
  ticket_comments?: Array<any>;
  labels?: Label[];
  reactions?: Reaction[];
  milestone?: Milestone;
}

interface User {
  id: string;
  email: string;
  display_name?: string;
  roles?: string[];
}

interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    display_name?: string;
  };
  reactions?: Reaction[];
}

interface Reaction {
  id: string;
  user_id: string;
  reaction: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    display_name?: string;
  };
}

const REACTIONS = [
  { type: '+1', emoji: '👍', label: 'Thumbs up' },
  { type: '-1', emoji: '👎', label: 'Thumbs down' },
  { type: 'laugh', emoji: '😄', label: 'Laugh' },
  { type: 'hooray', emoji: '🎉', label: 'Hooray' },
  { type: 'confused', emoji: '😕', label: 'Confused' },
  { type: 'heart', emoji: '❤️', label: 'Heart' },
  { type: 'rocket', emoji: '🚀', label: 'Rocket' },
  { type: 'eyes', emoji: '👀', label: 'Eyes' },
];

export default function GitHubStyleTickets() {
  // State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);

  // Permissions
  const isSuperAdmin = currentUserRoles.includes("Super Admin");
  const isDevTeamAdmin = currentUserRoles.includes("Dev Team Admin");
  const isAdmistater = currentUserRoles.includes("Admistater");
  const hasFullAccess = isSuperAdmin || isDevTeamAdmin;
  const hasReadAccess = hasFullAccess || isAdmistater;

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("open");
  const [filterLabel, setFilterLabel] = useState<string>("all");
  const [filterMilestone, setFilterMilestone] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create issue dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newLabels, setNewLabels] = useState<string[]>([]);
  const [newMilestone, setNewMilestone] = useState("");
  const [newAssignees, setNewAssignees] = useState<string[]>([]);

  // Comment
  const [newComment, setNewComment] = useState("");

  // Assignment dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigningTicket, setAssigningTicket] = useState<Ticket | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  // Detail view
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Init
  useEffect(() => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("user");
      console.log("=== Initializing Tickets Component ===");
      console.log("User data from localStorage:", data);
      if (data) {
        try {
          const user = JSON.parse(data);
          console.log("Parsed user:", user);
          console.log("User roles:", user.roles);
          setCurrentUserId(user.id || "");
          setCurrentUserRoles(user.roles || []);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }
  }, []);

  // Fetch data only if user has access
  useEffect(() => {
    if (currentUserRoles.length > 0 && hasReadAccess) {
      fetchTickets();
      fetchLabels();
      fetchMilestones();
      fetchUsers();
    }
  }, [currentUserRoles]);

  // Fetch functions
  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (res.ok) setTickets(data.tickets || []);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    }
  };

  const fetchLabels = async () => {
    try {
      const res = await fetch("/api/tickets/labels");
      const data = await res.json();
      if (res.ok) setLabels(data.labels || []);
    } catch {}
  };

  const fetchMilestones = async () => {
    try {
      const res = await fetch("/api/tickets/milestones");
      const data = await res.json();
      if (res.ok) setMilestones(data.milestones || []);
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users/list");
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch {}
  };

  const fetchComments = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/tickets/comments?ticket_id=${ticketId}`);
      const data = await res.json();
      if (res.ok) setComments(data.comments || []);
    } catch {}
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (res.ok) {
        const ticket = data.tickets?.find((t: Ticket) => t.id === ticketId);
        return ticket;
      }
    } catch {}
    return null;
  };

  // Create issue
  const handleCreateIssue = async () => {
    if (!hasFullAccess) {
      toast.error("You don't have permission to create issues");
      return;
    }

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
          milestone_id: newMilestone || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const ticketId = data.ticket.id;
        
        // Assign users if any selected
        if (newAssignees.length > 0) {
          const assignRes = await fetch("/api/tickets/assign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ticket_id: ticketId,
              user_ids: newAssignees,
              assigned_by: currentUserId,
            }),
          });
          
          if (!assignRes.ok) {
            console.error("Failed to assign users during creation");
          }
        }

        toast.success(`Issue #${data.ticket.issue_number} created`);
        setCreateOpen(false);
        clearForm();
        fetchTickets();
      } else {
        toast.error(data.error || "Failed to create issue");
      }
    } catch {
      toast.error("Failed to create issue");
    } finally {
      setLoading(false);
    }
  };

  // Toggle issue status (open/close)
  const toggleIssueStatus = async (ticket: Ticket) => {
    if (!hasFullAccess) {
      toast.error("You don't have permission to change issue status");
      return;
    }

    const newStatus = ticket.status === "open" ? "closed" : "open";
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ticket.id,
          status: newStatus,
          closed_by: newStatus === "closed" ? currentUserId : null,
        }),
      });

      if (res.ok) {
        toast.success(`Issue ${newStatus === "closed" ? "closed" : "reopened"}`);
        fetchTickets();
        if (selectedTicket?.id === ticket.id) {
          setSelectedTicket({ ...ticket, status: newStatus });
        }
      } else {
        toast.error("Failed to update issue");
      }
    } catch {
      toast.error("Failed to update issue");
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!hasFullAccess) {
      toast.error("You don't have permission to add comments");
      return;
    }

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
        toast.success("Comment added");
        setNewComment("");
        fetchComments(selectedTicket.id);
      } else {
        toast.error("Failed to add comment");
      }
    } catch {
      toast.error("Failed to add comment");
    }
  };

  // Add reaction
  const handleAddReaction = async (ticketId: string, reactionType: string) => {
    if (!hasFullAccess) {
      toast.error("You don't have permission to add reactions");
      return;
    }

    try {
      const res = await fetch("/api/tickets/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticketId,
          user_id: currentUserId,
          reaction: reactionType,
        }),
      });

      if (res.ok) {
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          fetchComments(ticketId);
        }
      }
    } catch {
      toast.error("Failed to add reaction");
    }
  };

  // Open assignment dialog
  const openAssignmentDialog = (ticket: Ticket) => {
    console.log("=== Opening Assignment Dialog ===");
    console.log("hasFullAccess:", hasFullAccess);
    console.log("isSuperAdmin:", isSuperAdmin);
    console.log("isDevTeamAdmin:", isDevTeamAdmin);
    console.log("currentUserRoles:", currentUserRoles);
    
    if (!hasFullAccess) {
      toast.error("You don't have permission to assign issues");
      return;
    }
    console.log("Opening assignment dialog for ticket:", ticket);
    console.log("Current assignments:", ticket.ticket_assignments);
    console.log("Available users:", users.length);
    setAssigningTicket(ticket);
    setSelectedAssignees(ticket.ticket_assignments?.map(a => a.assigned_user.id) || []);
    setAssignOpen(true);
  };

  // Handle assignment
  const handleAssignIssue = async () => {
    if (!assigningTicket || !hasFullAccess) return;

    console.log("Assigning issue:", assigningTicket.id);
    console.log("Selected assignees:", selectedAssignees);

    setLoading(true);
    try {
      // First, get current assignments to remove
      const oldAssignmentIds = (assigningTicket.ticket_assignments || []).map(a => a.id);
      console.log("Removing old assignments:", oldAssignmentIds);
      
      // Remove old assignments
      for (const assignmentId of oldAssignmentIds) {
        const res = await fetch(`/api/tickets/assign?assignment_id=${assignmentId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          console.error("Failed to remove assignment:", assignmentId);
        }
      }

      // Add new assignments if any selected
      if (selectedAssignees.length > 0) {
        console.log("Adding new assignments:", selectedAssignees);
        const res = await fetch("/api/tickets/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticket_id: assigningTicket.id,
            user_ids: selectedAssignees,
            assigned_by: currentUserId,
          }),
        });

        const data = await res.json();
        console.log("Assignment response:", data);
        if (!res.ok) {
          throw new Error(data.error || "Failed to assign");
        }
      }

      toast.success("Issue assigned successfully");
      setAssignOpen(false);
      setAssigningTicket(null);
      setSelectedAssignees([]);
      fetchTickets();
      if (selectedTicket?.id === assigningTicket.id) {
        const updatedTicket = await fetchTicketDetails(assigningTicket.id);
        if (updatedTicket) setSelectedTicket(updatedTicket);
      }
    } catch (error: any) {
      console.error("Assignment error:", error);
      toast.error(error.message || "Failed to assign issue");
    } finally {
      setLoading(false);
    }
  };

  // Toggle assignee selection
  const toggleAssignee = (userId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const clearForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewPriority("medium");
    setNewLabels([]);
    setNewMilestone("");
    setNewAssignees([]);
  };

  const openIssueDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchComments(ticket.id);
    setDetailsOpen(true);
  };

  // Filtering
  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus !== "all" && ticket.status !== filterStatus) return false;
    if (searchQuery && !ticket.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const openIssues = tickets.filter((t) => t.status === "open").length;
  const closedIssues = tickets.filter((t) => t.status === "closed").length;

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return "??";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  // Get dev members and admins for assignment
  const getAssignableUsers = () => {
    console.log("All users:", users);
    const assignable = users.filter(user => {
      const userRoles = user.roles || [];
      console.log(`User ${user.email} has roles:`, userRoles);
      return userRoles.includes("Dev Member") || 
             userRoles.includes("Dev Team Admin") ||
             userRoles.includes("Super Admin");
    });
    console.log("Assignable users:", assignable);
    return assignable;
  };

  // Check access
  if (!hasReadAccess && currentUserRoles.length > 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access the ticket system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Only <strong>Super Admin</strong>, <strong>Dev Team Admin</strong>, and <strong>Admistater</strong> can access tickets.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors closeButton />

      {/* Debug Panel - Remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mb-4 mx-4 border-yellow-500">
          <CardContent className="pt-4">
            <div className="text-xs space-y-1">
              <div><strong>Debug Info:</strong></div>
              <div>Current User ID: {currentUserId || 'Not set'}</div>
              <div>Roles: {currentUserRoles.join(', ') || 'None'}</div>
              <div>Is Super Admin: {isSuperAdmin ? 'Yes' : 'No'}</div>
              <div>Is Dev Team Admin: {isDevTeamAdmin ? 'Yes' : 'No'}</div>
              <div>Is Admistater: {isAdmistater ? 'Yes' : 'No'}</div>
              <div>Has Full Access: {hasFullAccess ? 'Yes' : 'No'}</div>
              <div>Has Read Access: {hasReadAccess ? 'Yes' : 'No'}</div>
              <div>Total Users Loaded: {users.length}</div>
              <div>Assignable Users: {getAssignableUsers().length}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Issues</h2>
            <p className="text-muted-foreground">
              Track bugs, features, and tasks
            </p>
          </div>
          {hasFullAccess && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New issue
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create new issue</DialogTitle>
                <DialogDescription>
                  Describe the bug, feature request, or task
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief summary of the issue"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the issue..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={6}
                  />
                </div>
                <div>
                  <Label>Assignees</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {getAssignableUsers().map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`assign-${user.id}`}
                          checked={newAssignees.includes(user.id)}
                          onChange={() => {
                            setNewAssignees(prev =>
                              prev.includes(user.id)
                                ? prev.filter(id => id !== user.id)
                                : [...prev, user.id]
                            );
                          }}
                          className="rounded border-gray-300"
                        />
                        <label
                          htmlFor={`assign-${user.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {user.display_name || user.email}
                          {user.roles?.includes("Dev Team Admin") && (
                            <Badge variant="outline" className="ml-2 text-xs">Admin</Badge>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
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
                  <div>
                    <Label htmlFor="milestone">Milestone</Label>
                    <Select value={newMilestone} onValueChange={setNewMilestone}>
                      <SelectTrigger id="milestone">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {milestones
                          .filter((m) => m.state === "open")
                          .map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateIssue} disabled={loading}>
                    {loading ? "Creating..." : "Create issue"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          )}
          {isAdmistater && !hasFullAccess && (
            <Badge variant="outline" className="text-sm">
              Read-only access
            </Badge>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "open" ? "default" : "outline"}
                  onClick={() => setFilterStatus("open")}
                  size="sm"
                  className="gap-2"
                >
                  <Circle className="h-3 w-3" />
                  {openIssues} Open
                </Button>
                <Button
                  variant={filterStatus === "closed" ? "default" : "outline"}
                  onClick={() => setFilterStatus("closed")}
                  size="sm"
                  className="gap-2"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {closedIssues} Closed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issues List */}
        <Card>
          <CardContent className="p-0">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No issues found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => openIssueDetails(ticket)}
                  >
                    <div className="flex items-start gap-3">
                      {ticket.status === "open" ? (
                        <Circle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-semibold hover:text-blue-600">
                            {ticket.title}
                          </h3>
                          {ticket.labels?.map((label) => (
                            <Badge
                              key={label.id}
                              style={{
                                backgroundColor: `${label.color}20`,
                                color: label.color,
                                borderColor: label.color,
                              }}
                              variant="outline"
                              className="text-xs"
                            >
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                          <span>
                            #{ticket.issue_number} opened {formatDate(ticket.created_at)} by{" "}
                            {ticket.created_by_user?.display_name ||
                              ticket.created_by_user?.email}
                          </span>
                          {ticket.milestone && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MilestoneIcon className="h-3 w-3" />
                                {ticket.milestone.title}
                              </span>
                            </>
                          )}
                          {ticket.ticket_assignments && ticket.ticket_assignments.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                Assigned to{" "}
                                {ticket.ticket_assignments[0].assigned_user.display_name ||
                                  ticket.ticket_assignments[0].assigned_user.email}
                                {ticket.ticket_assignments.length > 1 &&
                                  ` +${ticket.ticket_assignments.length - 1}`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {ticket.is_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                        <Badge variant="outline" className="gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {ticket.ticket_comments?.length || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Issue Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {selectedTicket.status === "open" ? (
                      <Circle className="h-6 w-6 text-green-500 mt-1" />
                    ) : (
                      <CheckCircle2 className="h-6 w-6 text-purple-500 mt-1" />
                    )}
                    <div className="flex-1">
                      <DialogTitle className="text-2xl">
                        {selectedTicket.title}
                      </DialogTitle>
                      <DialogDescription className="mt-2">
                        #{selectedTicket.issue_number} •{" "}
                        {selectedTicket.status === "open" ? "Open" : "Closed"} •{" "}
                        {selectedTicket.created_by_user?.display_name || selectedTicket.created_by_user?.email}{" "}
                        opened this issue {formatDate(selectedTicket.created_at)}
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {hasFullAccess && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => openAssignmentDialog(selectedTicket)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Assign
                        </Button>
                        <Button
                          variant={selectedTicket.status === "open" ? "destructive" : "default"}
                          onClick={() => toggleIssueStatus(selectedTicket)}
                        >
                          {selectedTicket.status === "open" ? "Close issue" : "Reopen issue"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4 mt-4">
                {/* Issue description */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(
                            selectedTicket.created_by_user?.display_name,
                            selectedTicket.created_by_user?.email
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">
                            {selectedTicket.created_by_user?.display_name ||
                              selectedTicket.created_by_user?.email}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(selectedTicket.created_at)}
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                        </div>
                        
                        {/* Reactions */}
                        {hasFullAccess && (
                          <div className="flex gap-2 mt-4 flex-wrap">
                            {REACTIONS.map((r) => (
                              <Button
                                key={r.type}
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddReaction(selectedTicket.id, r.type)}
                                className="gap-1"
                              >
                                <span>{r.emoji}</span>
                                <span className="text-xs">
                                  {selectedTicket.reactions?.filter((react) => react.reaction === r.type)
                                    .length || 0}
                                </span>
                              </Button>
                            ))}
                          </div>
                        )}
                        {isAdmistater && !hasFullAccess && selectedTicket.reactions && selectedTicket.reactions.length > 0 && (
                          <div className="flex gap-2 mt-4 flex-wrap">
                            {REACTIONS.map((r) => {
                              const count = selectedTicket.reactions?.filter((react) => react.reaction === r.type).length || 0;
                              if (count === 0) return null;
                              return (
                                <Badge key={r.type} variant="outline" className="gap-1">
                                  <span>{r.emoji}</span>
                                  <span className="text-xs">{count}</span>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comments */}
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-6">
                      <div className="flex gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(comment.user?.display_name, comment.user?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {comment.user?.display_name || comment.user?.email}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">{comment.comment}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Add comment */}
                {hasFullAccess && !selectedTicket.is_locked && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={4}
                        />
                        <div className="flex justify-end">
                          <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                            Comment
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isAdmistater && !hasFullAccess && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>You have read-only access to this issue</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedTicket.is_locked && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                        <span>This conversation has been locked</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Issue</DialogTitle>
            <DialogDescription>
              Assign this issue to team members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {getAssignableUsers().length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No dev team members available</p>
                <p className="text-xs mt-1">Users need "Dev Member", "Dev Team Admin", or "Super Admin" role</p>
              </div>
            ) : (
              <div className="border rounded-lg p-3 max-h-96 overflow-y-auto space-y-2">
              {getAssignableUsers().map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`assignee-${user.id}`}
                    checked={selectedAssignees.includes(user.id)}
                    onChange={() => toggleAssignee(user.id)}
                    className="rounded border-gray-300"
                  />
                  <label
                    htmlFor={`assignee-${user.id}`}
                    className="text-sm cursor-pointer flex-1 flex items-center gap-2"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(user.display_name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.display_name || user.email}</span>
                    {user.roles?.includes("Dev Team Admin") && (
                      <Badge variant="outline" className="text-xs">Admin</Badge>
                    )}
                    {user.roles?.includes("Super Admin") && (
                      <Badge variant="destructive" className="text-xs">Super Admin</Badge>
                    )}
                  </label>
                </div>
              ))}
            </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignIssue} disabled={loading}>
                {loading ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
