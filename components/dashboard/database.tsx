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
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  role?: string;
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
                              {u.role || "user"}
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
                                title="View message"
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
    </>
  );
}
