"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database as DatabaseIcon,
  RefreshCw,
  Download,
  Search,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
  id: string;
  email: string;
  personal_email?: string | null;
  display_name: string | null;
  created_at: string;
  role?: string;
  roles?: string[];
  is_active?: boolean;
}

interface ChatGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count?: number;
}

interface ChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_email?: string;
  group_name?: string;
}

export default function Database() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState<
    "users" | "groups" | "messages"
  >("users");
  const [userData, setUserData] = useState<User[]>([]);
  const [groupsData, setGroupsData] = useState<ChatGroup[]>([]);
  const [messagesData, setMessagesData] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [deleteMessageOpen, setDeleteMessageOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPersonalEmail, setEditPersonalEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // debounce search for snappy UX
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(searchQuery.trim().toLowerCase()),
      300
    );
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    fetchAllData();
    fetchAvailableRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchGroups(), fetchMessages()]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load database");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users/list");
      if (!res.ok) return setUserData([]);
      const data = await res.json();
      setUserData(data.users || []);
    } catch (e) {
      console.error(e);
      setUserData([]);
    }
  }

  async function fetchAvailableRoles() {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        setAvailableRoles(data.roles || []);
      }
    } catch (e) {
      console.error("Failed to fetch roles:", e);
    }
  }

  async function fetchGroups() {
    try {
      const res = await fetch("/api/chat/groups/all");
      if (!res.ok) return setGroupsData([]);
      const data = await res.json();
      setGroupsData(data.groups || []);
    } catch (e) {
      console.error(e);
      setGroupsData([]);
    }
  }

  async function fetchMessages() {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return setMessagesData([]);
      const user = JSON.parse(userData);

      const res = await fetch("/api/chat/groups/all");
      if (!res.ok) return setMessagesData([]);
      const groupsRes = await res.json();

      if (groupsRes.groups && groupsRes.groups.length > 0) {
        const allMessages: ChatMessage[] = [];
        for (const group of groupsRes.groups) {
          const msgRes = await fetch(
            `/api/chat/messages?group_id=${group.id}&user_id=${user.id}`
          );
          if (!msgRes.ok) continue;
          const msgData = await msgRes.json();
          const messagesWithGroup = (msgData.messages || []).map(
            (msg: any) => ({ ...msg, group_name: group.name })
          );
          allMessages.push(...messagesWithGroup);
        }
        setMessagesData(allMessages);
      } else {
        setMessagesData([]);
      }
    } catch (e) {
      console.error(e);
      setMessagesData([]);
    }
  }

  async function handleDeleteGroup() {
    if (!selectedGroup) return;

    try {
      const res = await fetch(`/api/chat/groups/${selectedGroup.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(`Group "${selectedGroup.name}" deleted successfully`);
        setDeleteGroupOpen(false);
        setSelectedGroup(null);
        await fetchGroups();
        await fetchMessages(); // Refresh messages as they depend on groups
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Delete group error:', error);
      toast.error('Failed to delete group');
    }
  }

  async function handleDeleteMessage() {
    if (!selectedMessage) return;

    try {
      const res = await fetch(`/api/chat/messages/${selectedMessage.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Message deleted successfully');
        setDeleteMessageOpen(false);
        setSelectedMessage(null);
        await fetchMessages();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Delete message error:', error);
      toast.error('Failed to delete message');
    }
  }

  async function handleUpdateUser() {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      // Update profile
      const profileRes = await fetch('/api/users/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          display_name: editDisplayName,
          email: editEmail,
          personal_email: editPersonalEmail,
        }),
      });

      if (!profileRes.ok) {
        const contentType = profileRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await profileRes.json();
          toast.error(data.error || 'Failed to update user');
        } else {
          const text = await profileRes.text();
          console.error('Profile update error (non-JSON):', text);
          toast.error('Failed to update user profile');
        }
        setIsUpdating(false);
        return;
      }

      // Update roles
      const rolesRes = await fetch('/api/users/update-roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          roles: selectedRoles,
        }),
      });

      if (rolesRes.ok) {
        toast.success('User updated successfully');
        setEditUserOpen(false);
        await fetchUsers();
      } else {
        const contentType = rolesRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await rolesRes.json();
          toast.error(data.error || 'Failed to update roles');
        } else {
          const text = await rolesRes.text();
          console.error('Roles update error (non-JSON):', text);
          toast.error('Failed to update roles');
        }
      }
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDeactivateUser() {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      const res = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
        }),
      });

      if (res.ok) {
        toast.success('User deactivated successfully');
        setEditUserOpen(false);
        setSelectedUser(null);
        await fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to deactivate user');
      }
    } catch (error) {
      console.error('Deactivate user error:', error);
      toast.error('Failed to deactivate user');
    } finally {
      setIsUpdating(false);
    }
  }

  const totals = useMemo(
    () => ({
      totalRecords: userData.length + groupsData.length + messagesData.length,
      users: userData.length,
      groups: groupsData.length,
      messages: messagesData.length,
    }),
    [userData.length, groupsData.length, messagesData.length]
  );

  const filteredUsers = useMemo(() => {
    if (!debouncedQuery) return userData;
    return userData.filter(
      (u) =>
        (u.email || "").toLowerCase().includes(debouncedQuery) ||
        (u.display_name || "").toLowerCase().includes(debouncedQuery) ||
        (u.role || "").toLowerCase().includes(debouncedQuery)
    );
  }, [userData, debouncedQuery]);

  const filteredGroups = useMemo(() => {
    if (!debouncedQuery) return groupsData;
    return groupsData.filter(
      (g) =>
        (g.name || "").toLowerCase().includes(debouncedQuery) ||
        (g.description || "").toLowerCase().includes(debouncedQuery)
    );
  }, [groupsData, debouncedQuery]);

  const filteredMessages = useMemo(() => {
    if (!debouncedQuery) return messagesData;
    return messagesData.filter(
      (m) =>
        (m.message || "").toLowerCase().includes(debouncedQuery) ||
        (m.group_name || "").toLowerCase().includes(debouncedQuery)
    );
  }, [messagesData, debouncedQuery]);

  function isoDate(d?: string) {
    try {
      return d ? new Date(d).toLocaleString() : "-";
    } catch (e) {
      return d || "-";
    }
  }

  function downloadCSV(table: "users" | "groups" | "messages") {
    let data: any[] = [];
    let headers: string[] = [];

    if (table === "users") {
      data = userData;
      headers = ["ID", "Email", "Display Name", "Role", "Created At"];
    } else if (table === "groups") {
      data = groupsData;
      headers = ["ID", "Name", "Description", "Created At"];
    } else {
      data = messagesData;
      headers = ["ID", "Group", "Message", "Created At"];
    }

    if (!data.length) return toast.error("No data to export");

    const csv = [
      headers.join(","),
      ...data.map((row) => {
        if (table === "users")
          return [
            row.id,
            row.email,
            row.display_name || "",
            row.role || "user",
            row.created_at,
          ].join(",");
        if (table === "groups")
          return [row.id, row.name, row.description || "", row.created_at].join(
            ","
          );
        return [
          row.id,
          (row as ChatMessage).group_name || "",
          (row as ChatMessage).message?.replace(/,/g, ";"),
          row.created_at,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${table}_export_${new Date().toISOString().split("T")[0]
      }.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  }

  return (
    <>
      <Toaster position="top-center" richColors closeButton />

      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Database Management</h1>
            <p className="text-sm text-muted-foreground">
              Browse, search and export tables — improved layout and
              performance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <Card className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="text-lg font-bold">
                      {totals.totalRecords}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total records
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  fetchAllData();
                  toast.success("Refreshed");
                }}
                disabled={loading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button onClick={() => downloadCSV(selectedTable)}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.users}</div>
              <div className="text-xs text-muted-foreground">Total users</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm">Chat Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.groups}</div>
              <div className="text-xs text-muted-foreground">Active groups</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.messages}</div>
              <div className="text-xs text-muted-foreground">
                Total messages
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Tables</CardTitle>
            <CardDescription>
              Search across tables and inspect rows. Tip: press Esc to clear
              search.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
              <div className="flex-1 flex items-center gap-2">
                <div className="relative flex-1 max-w-2xl">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search records, emails, group names..."
                    className="pl-10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery("");
                      setDebouncedQuery("");
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={() => {
                      /* create record flow */
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Record
                  </Button>
                </div>
              </div>

              <div className="w-full md:w-auto">
                <Tabs
                  value={selectedTable}
                  onValueChange={(v) => setSelectedTable(v as any)}
                >
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="users">
                      Users ({totals.users})
                    </TabsTrigger>
                    <TabsTrigger value="groups">
                      Groups ({totals.groups})
                    </TabsTrigger>
                    <TabsTrigger value="messages">
                      Messages ({totals.messages})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Table container */}
            <div className=" overflow-auto">
              {selectedTable === "users" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>UUID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i} className="animate-pulse">
                          <TableCell className="font-mono text-xs">
                            &nbsp;
                          </TableCell>
                          <TableCell className="font-medium">&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                        </TableRow>
                      ))
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground"
                        >
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow key={u.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-xs">
                            {u.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium">
                            {u.display_name || "—"}
                          </TableCell>
                          <TableCell className="text-sm">{u.email}</TableCell>
                          <TableCell>
                            <span className="capitalize text-sm font-medium">
                              {u.roles && u.roles.length > 0
                                ? u.roles.join(", ")
                                : u.role || "No role"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100">
                              Active
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Edit user"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setEditDisplayName(u.display_name || "");
                                  setEditEmail(u.email);
                                  setEditPersonalEmail(u.personal_email || "");
                                  setSelectedRoles(u.roles || []);
                                  setEditUserOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {selectedTable === "groups" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i} className="animate-pulse">
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                        </TableRow>
                      ))
                    ) : filteredGroups.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground"
                        >
                          No groups found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGroups.map((g) => (
                        <TableRow key={g.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-xs">
                            {g.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium">
                            {g.name}
                          </TableCell>
                          <TableCell className="text-sm truncate max-w-xl">
                            {g.description || "No description"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {isoDate(g.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Edit group"
                                onClick={() => {
                                  setSelectedGroup(g);
                                  setEditGroupOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete group"
                                onClick={() => {
                                  setSelectedGroup(g);
                                  setDeleteGroupOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
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
              )}

              {selectedTable === "messages" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i} className="animate-pulse">
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                        </TableRow>
                      ))
                    ) : filteredMessages.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground"
                        >
                          No messages found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMessages.slice(0, 50).map((m) => (
                        <TableRow key={m.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-xs">
                            {m.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium">
                            {m.group_name}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {m.message}
                          </TableCell>
                          <TableCell className="text-sm">
                            {isoDate(m.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete message"
                                onClick={() => {
                                  setSelectedMessage(m);
                                  setDeleteMessageOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
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
              )}

              {/* small footer when messages trimmed */}
              {selectedTable === "messages" && filteredMessages.length > 50 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t">
                  Showing first 50 of {filteredMessages.length} messages
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Utilities for common operations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => downloadCSV(selectedTable)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                fetchAllData();
                toast.success("Refreshed");
              }}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh Data
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => toast.info("Connected")}
            >
              <DatabaseIcon className="mr-2 h-4 w-4" />
              Database Info
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details, assign roles, or deactivate the account.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Login Email (@lnc.com)</Label>
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1"
                  type="email"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email used for login (usually @lnc.com)
                </p>
              </div>
              <div>
                <Label>Personal Email (for notifications)</Label>
                <Input
                  value={editPersonalEmail}
                  onChange={(e) => setEditPersonalEmail(e.target.value)}
                  className="mt-1"
                  type="email"
                  placeholder="real.email@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Real email address where notifications will be sent
                </p>
              </div>
              <div>
                <Label>Display Name</Label>
                <Input
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="mt-1"
                  placeholder="Enter display name"
                />
              </div>
              <div>
                <Label>Roles</Label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {availableRoles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Loading roles...</p>
                  ) : (
                    availableRoles.map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role}`}
                          checked={selectedRoles.includes(role)}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              setSelectedRoles([...selectedRoles, role]);
                            } else {
                              setSelectedRoles(selectedRoles.filter((r) => r !== role));
                            }
                          }}
                        />
                        <label
                          htmlFor={`role-${role}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {role}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Select one or more roles for this user
                </p>
              </div>
              <div>
                <Label>User ID</Label>
                <Input value={selectedUser.id} disabled className="mt-1 font-mono text-xs" />
              </div>
              <div>
                <Label>Account Status</Label>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100">
                    {selectedUser.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div>
                <Label>Created At</Label>
                <Input value={isoDate(selectedUser.created_at)} disabled className="mt-1" />
              </div>
              <div className="flex justify-between gap-2 mt-6 pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={handleDeactivateUser}
                  disabled={isUpdating}
                >
                  Deactivate User
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditUserOpen(false)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateUser}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={editGroupOpen} onOpenChange={setEditGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              View group details. To manage members, use the Chat section.
            </DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div>
                <Label>Group Name</Label>
                <Input value={selectedGroup.name} disabled className="mt-1" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={selectedGroup.description || "No description"}
                  disabled
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label>Group ID</Label>
                <Input value={selectedGroup.id} disabled className="mt-1 font-mono text-xs" />
              </div>
              <div>
                <Label>Created At</Label>
                <Input value={isoDate(selectedGroup.created_at)} disabled className="mt-1" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setEditGroupOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <Dialog open={deleteGroupOpen} onOpenChange={setDeleteGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Group: <span className="font-bold">{selectedGroup.name}</span>
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  All messages in this group will also be deleted.
                </p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setDeleteGroupOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteGroup}
                >
                  Delete Group
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Message Confirmation Dialog */}
      <Dialog open={deleteMessageOpen} onOpenChange={setDeleteMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Message: <span className="font-normal">{selectedMessage.message.substring(0, 100)}{selectedMessage.message.length > 100 ? '...' : ''}</span>
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  From group: {selectedMessage.group_name}
                </p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setDeleteMessageOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteMessage}
                >
                  Delete Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
