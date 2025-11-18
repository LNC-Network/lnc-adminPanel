"use client";
import { Label } from "../ui/label";
import {
  Plus,
  Trash2,
  Shield,
  User,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  Users,
  Code,
  MessageSquare,
  Megaphone,
  Palette,
} from "lucide-react";
import { isSuperAdmin, isAdmistater } from "@/lib/permissions";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import ThemeSwitch from "../ThemeSwitch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "../ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface AuthUser {
  id: string;
  email: string;
  display_name?: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: {
    role?: string;
  };
  roles?: string[];
}

interface PendingUser {
  id: string;
  display_name: string;
  email: string;
  team: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
}

export default function Settings() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  // User creation form states
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [team, setTeam] = useState("");
  const [newUserRoles, setNewUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPending, setSelectedPending] = useState<PendingUser | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  const canEdit = !isAdmistater(currentUserRoles);
  const canCreateUser = isSuperAdmin(currentUserRoles);

  const clear = () => {
    setDisplayName("");
    setEmail("");
    setPersonalEmail("");
    setPassword("");
    setConfirmPassword("");
    setTeam("");
    setNewUserRoles([]);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUserId(user.id || "");
          setCurrentUserRoles(user.roles || []);
        } catch (e) {
          console.error("Failed to parse user data:", e);
        }
      }
    }
    fetchUsers();
    fetchPendingUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users/fetch?start=0&end=100");
      const json = await res.json();

      if (res.ok) {
        setUsers(json.data || []);
      } else {
        toast.error(json.error || "Failed to fetch users");
      }
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const res = await fetch("/api/users/pending");
      const json = await res.json();

      if (res.ok) {
        setPendingUsers(json.pending_users || []);
      } else {
        toast.error(json.error || "Failed to fetch pending registrations");
      }
    } catch (error) {
      toast.error("Failed to fetch pending registrations");
      console.error(error);
    }
  };

  const handleApprove = async (
    pendingUser: PendingUser,
    assignedRole: string
  ) => {
    console.log("Approving user:", pendingUser.email, "as role:", assignedRole);
    console.log("Current user ID:", currentUserId);

    if (!currentUserId) {
      toast.error("Admin user ID not found. Please refresh and try again.");
      return;
    }

    setApprovingId(pendingUser.id);
    try {
      const payload = {
        pending_user_id: pendingUser.id,
        action: "approve",
        reviewed_by: currentUserId,
        role: assignedRole,
      };
      console.log("Sending approval request:", payload);

      const response = await fetch("/api/users/pending", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Approval response:", data);

      if (response.ok) {
        toast.success(`${pendingUser.email} approved and account created`);
        fetchPendingUsers();
        fetchUsers();
      } else {
        console.error("Approval failed:", data);
        toast.error(data.error || "Failed to approve registration");
      }
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve registration");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedPending) return;

    try {
      const response = await fetch("/api/users/pending", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pending_user_id: selectedPending.id,
          action: "reject",
          reviewed_by: currentUserId,
          rejection_reason: rejectionReason || "Not specified",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`${selectedPending.email} registration rejected`);
        setRejectDialogOpen(false);
        setRejectionReason("");
        setSelectedPending(null);
        fetchPendingUsers();
      } else {
        toast.error(data.error || "Failed to reject registration");
      }
    } catch (error) {
      toast.error("Failed to reject registration");
      console.error(error);
    }
  };

  const openRejectDialog = (pendingUser: PendingUser) => {
    setSelectedPending(pendingUser);
    setRejectDialogOpen(true);
  };

  const handleOpenRoleDialog = (user: AuthUser) => {
    setEditingUserId(user.id);
    setSelectedRoles(user.roles || []);
    setShowRoleDialog(true);
  };

  const handleUpdateRoles = async () => {
    if (!editingUserId) return;

    console.log(
      "Updating roles for user:",
      editingUserId,
      "to:",
      selectedRoles
    );

    try {
      const response = await fetch("/api/users/update-roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUserId,
          roles: selectedRoles,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("User roles updated successfully");
        setShowRoleDialog(false);
        setEditingUserId(null);
        setSelectedRoles([]);
        fetchUsers();
      } else {
        console.error("Failed to update roles:", data);
        toast.error(data.error || "Failed to update user roles");
      }
    } catch (error) {
      console.error("Error updating roles:", error);
      toast.error("Failed to update user roles");
    }
  };

  const addUser = async () => {
    // Validation
    if (!displayName || !email || !password || !confirmPassword) {
      toast.warning("Display name, email, and password are required");
      return;
    }

    if (!email.endsWith("@lnc.com")) {
      toast.warning("Email must be from @lnc.com domain");
      return;
    }

    if (password.length < 6) {
      toast.warning("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.warning("Passwords do not match");
      return;
    }

    if (newUserRoles.length === 0) {
      toast.warning("Please select at least one role");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/users/create-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          display_name: displayName,
          email, 
          personal_email: personalEmail || null,
          password,
          team: team || null,
          roles: newUserRoles
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`User ${displayName} created successfully!`);
        clear();
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to create user");
      }
    } catch (error) {
      toast.error("Failed to create user");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete ${userEmail}?`)) {
      return;
    }

    console.log("Deleting user:", userId, userEmail);

    try {
      const response = await fetch("/api/users/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      console.log("Delete response:", data);

      if (response.ok) {
        toast.success("User deleted");
        fetchUsers();
      } else {
        console.error("Delete failed:", data);
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete user");
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch("/api/users/update-role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Role updated to ${newRole}`);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to update role");
      }
    } catch (error) {
      toast.error("Failed to update role");
      console.error(error);
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage users, roles, and system configuration
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="pending">
              Pending Registrations
              {pendingUsers.filter((u) => u.status === "pending").length >
                0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingUsers.filter((u) => u.status === "pending").length}
                  </Badge>
                )}
            </TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[350px_1fr] lg:grid-cols-[400px_1fr]">
              {/* Create User Form - Left Side */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Create New User</CardTitle>
                  <CardDescription>
                    {canCreateUser
                      ? "Add a new user directly to the system (no approval needed)"
                      : "Only Super Admin can create new users"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {/* Display Name */}
                    <div className="grid gap-2">
                      <Label htmlFor="displayName">
                        <User className="inline h-4 w-4 mr-1" />
                        Full Name *
                      </Label>
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="John Doe"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={loading || !canCreateUser}
                      />
                    </div>

                    {/* Email */}
                    <div className="grid gap-2">
                      <Label htmlFor="email">Login Email (@lnc.com) *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@lnc.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading || !canCreateUser}
                      />
                      <p className="text-xs text-muted-foreground">
                        Must use @lnc.com email address
                      </p>
                    </div>

                    {/* Personal Email */}
                    <div className="grid gap-2">
                      <Label htmlFor="personalEmail">Personal Email (for notifications)</Label>
                      <Input
                        id="personalEmail"
                        type="email"
                        placeholder="user@gmail.com"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                        disabled={loading || !canCreateUser}
                      />
                      <p className="text-xs text-muted-foreground">
                        Notifications will be sent to this email
                      </p>
                    </div>

                    {/* Team */}
                    <div className="grid gap-2">
                      <Label htmlFor="team">Team/Department</Label>
                      <Select
                        value={team}
                        onValueChange={setTeam}
                        disabled={loading || !canCreateUser}
                      >
                        <SelectTrigger id="team">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Development">Development</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="HR">Human Resources</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Password */}
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading || !canCreateUser}
                      />
                    </div>

                    {/* Confirm Password */}
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading || !canCreateUser}
                      />
                    </div>

                    {/* Roles */}
                    <div className="grid gap-2">
                      <Label>Roles *</Label>
                      <div className="space-y-2 border rounded-lg p-3 max-h-64 overflow-y-auto">
                        {[
                          { name: "Super Admin", icon: Shield, color: "text-red-500" },
                          { name: "Admistater", icon: Shield, color: "text-blue-500" },
                          { name: "Dev Team Admin", icon: Code, color: "text-green-500" },
                          { name: "Social Media Team Admin", icon: MessageSquare, color: "text-purple-500" },
                          { name: "PR & Outreach Team Admin", icon: Megaphone, color: "text-orange-500" },
                          { name: "Design Team Admin", icon: Palette, color: "text-pink-500" },
                          { name: "Dev Member", icon: Code, color: "" },
                          { name: "Social Media Member", icon: MessageSquare, color: "" },
                          { name: "PR & Outreach Member", icon: Megaphone, color: "" },
                          { name: "Design Member", icon: Palette, color: "" },
                        ].map((roleOption) => {
                          const Icon = roleOption.icon;
                          return (
                            <div key={roleOption.name} className="flex items-center space-x-2">
                              <Checkbox
                                id={`role-${roleOption.name}`}
                                checked={newUserRoles.includes(roleOption.name)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewUserRoles([...newUserRoles, roleOption.name]);
                                  } else {
                                    setNewUserRoles(newUserRoles.filter((r) => r !== roleOption.name));
                                  }
                                }}
                                disabled={loading || !canCreateUser}
                              />
                              <label
                                htmlFor={`role-${roleOption.name}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                              >
                                <Icon className={`h-4 w-4 ${roleOption.color}`} />
                                {roleOption.name}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select one or more roles for this user
                      </p>
                    </div>

                    <Button
                      onClick={addUser}
                      disabled={loading || !canCreateUser}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {loading ? "Creating..." : "Create User"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* User Table - Right Side */}
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    View and manage all users in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last Sign In</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-muted-foreground"
                            >
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.email}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {user.roles && user.roles.length > 0 ? (
                                    user.roles.map((role, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="capitalize"
                                      >
                                        {role}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      No role
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Date(user.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {user.last_sign_in_at
                                  ? new Date(
                                    user.last_sign_in_at
                                  ).toLocaleDateString()
                                  : "Never"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenRoleDialog(user)}
                                    disabled={!canEdit}
                                  >
                                    Edit Roles
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() =>
                                      deleteUser(user.id, user.email || "")
                                    }
                                    disabled={!canEdit}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pending Registrations Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  <UserPlus className="inline h-5 w-5 mr-2" />
                  Pending Registration Requests
                </CardTitle>
                <CardDescription>
                  Review and approve new user registration requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground"
                          >
                            No pending registrations
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingUsers.map((pending) => (
                          <TableRow key={pending.id}>
                            <TableCell className="font-medium">
                              {pending.display_name}
                            </TableCell>
                            <TableCell>{pending.email}</TableCell>
                            <TableCell>{pending.team}</TableCell>
                            <TableCell>
                              {new Date(
                                pending.submitted_at
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {pending.status === "pending" && (
                                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              {pending.status === "approved" && (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              )}
                              {pending.status === "rejected" && (
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejected
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {pending.status === "pending" && (
                                <div className="flex justify-end gap-2">
                                  <Select
                                    disabled={approvingId === pending.id || !canEdit}
                                    onValueChange={(role) =>
                                      handleApprove(pending, role)
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue
                                        placeholder={
                                          approvingId === pending.id
                                            ? "Approving..."
                                            : canEdit
                                              ? "Approve as..."
                                              : "View only"
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="dev member">
                                        As Dev Member
                                      </SelectItem>
                                      <SelectItem value="social media member">
                                        As Social Media Member
                                      </SelectItem>
                                      <SelectItem value="pr & outreach member">
                                        As PR & Outreach Member
                                      </SelectItem>
                                      <SelectItem value="design member">
                                        As Design Member
                                      </SelectItem>
                                      <SelectItem value="dev team admin">
                                        As Dev Team Admin
                                      </SelectItem>
                                      <SelectItem value="social media team admin">
                                        As Social Media Team Admin
                                      </SelectItem>
                                      <SelectItem value="pr & outreach team admin">
                                        As PR & Outreach Team Admin
                                      </SelectItem>
                                      <SelectItem value="design team admin">
                                        As Design Team Admin
                                      </SelectItem>
                                      <SelectItem value="admistater">
                                        As Admistater
                                      </SelectItem>
                                      <SelectItem value="super admin">
                                        As Super Admin
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => openRejectDialog(pending)}
                                    disabled={approvingId === pending.id || !canEdit}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              {pending.status !== "pending" && (
                                <span className="text-sm text-muted-foreground">
                                  {new Date(
                                    pending.reviewed_at || ""
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of the admin panel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark mode
                    </p>
                  </div>
                  <ThemeSwitch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Registration</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject {selectedPending?.email}?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rejection_reason">Reason (optional)</Label>
                <Textarea
                  id="rejection_reason"
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                  setSelectedPending(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Reject Registration
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Role Selection Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Roles</DialogTitle>
              <DialogDescription>
                Select one or more roles for this user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-muted-foreground">Administration</div>
                {["super admin", "admistater"].map((role) => (
                  <div key={role} className="flex items-center space-x-2 pl-2">
                    <Checkbox
                      id={role}
                      checked={selectedRoles.includes(role)}
                      disabled={!canEdit}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRoles([...selectedRoles, role]);
                        } else {
                          setSelectedRoles(
                            selectedRoles.filter((r) => r !== role)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={role}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                    >
                      {role}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-muted-foreground">Team Admins</div>
                {["dev team admin", "social media team admin", "pr & outreach team admin", "design team admin"].map((role) => (
                  <div key={role} className="flex items-center space-x-2 pl-2">
                    <Checkbox
                      id={role}
                      checked={selectedRoles.includes(role)}
                      disabled={!canEdit}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRoles([...selectedRoles, role]);
                        } else {
                          setSelectedRoles(
                            selectedRoles.filter((r) => r !== role)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={role}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                    >
                      {role}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-muted-foreground">Team Members</div>
                {["dev member", "social media member", "pr & outreach member", "design member"].map((role) => (
                  <div key={role} className="flex items-center space-x-2 pl-2">
                    <Checkbox
                      id={role}
                      checked={selectedRoles.includes(role)}
                      disabled={!canEdit}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRoles([...selectedRoles, role]);
                        } else {
                          setSelectedRoles(
                            selectedRoles.filter((r) => r !== role)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={role}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                    >
                      {role}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRoleDialog(false);
                  setEditingUserId(null);
                  setSelectedRoles([]);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateRoles} disabled={!canEdit}>
                Save Roles
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
