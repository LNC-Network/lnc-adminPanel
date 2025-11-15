"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Database as DatabaseIcon,
  RefreshCw,
  Download,
  Upload,
  Search,
  Plus,
  Trash2,
  Edit
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
  const [selectedTable, setSelectedTable] = useState("users");
  const [userData, setUserData] = useState<User[]>([]);
  const [groupsData, setGroupsData] = useState<ChatGroup[]>([]);
  const [messagesData, setMessagesData] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchGroups(),
        fetchMessages()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load database");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users/list");
      const data = await res.json();
      if (res.ok) {
        setUserData(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/chat/groups");
      const data = await res.json();
      if (res.ok) {
        setGroupsData(data.groups || []);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      // Fetch messages for all groups
      const userData = localStorage.getItem("user");
      if (!userData) return;
      const user = JSON.parse(userData);

      const res = await fetch("/api/chat/groups");
      const groupsRes = await res.json();

      if (groupsRes.groups && groupsRes.groups.length > 0) {
        const allMessages: ChatMessage[] = [];

        for (const group of groupsRes.groups) {
          const msgRes = await fetch(`/api/chat/messages?group_id=${group.id}&user_id=${user.id}`);
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            const messagesWithGroup = (msgData.messages || []).map((msg: any) => ({
              ...msg,
              group_name: group.name
            }));
            allMessages.push(...messagesWithGroup);
          }
        }

        setMessagesData(allMessages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  useEffect(() => {
    setTotalRecords(userData.length + groupsData.length + messagesData.length);
  }, [userData, groupsData, messagesData]);

  const handleRefresh = () => {
    fetchAllData();
    toast.success("Database refreshed");
  };

  const handleExport = () => {
    let data: any[] = [];
    let headers: string[] = [];

    switch (selectedTable) {
      case "users":
        data = userData;
        headers = ["ID", "Email", "Display Name", "Role", "Created At"];
        break;
      case "groups":
        data = groupsData;
        headers = ["ID", "Name", "Description", "Created At"];
        break;
      case "messages":
        data = messagesData;
        headers = ["ID", "Group", "Message", "Created At"];
        break;
    }

    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csv = [
      headers.join(","),
      ...data.map(row => {
        if (selectedTable === "users") {
          return [row.id, row.email, row.display_name || "", row.role || "user", row.created_at].join(",");
        } else if (selectedTable === "groups") {
          return [row.id, row.name, row.description || "", row.created_at].join(",");
        } else {
          return [row.id, (row as ChatMessage).group_name || "", row.message?.replace(/,/g, ";"), row.created_at].join(",");
        }
      })
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTable}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const filteredUsers = userData.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groupsData.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMessages = messagesData.filter(msg =>
    msg.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (msg as ChatMessage).group_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Database Management</h2>
            <p className="text-muted-foreground">View and manage your database tables</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRecords}</div>
              <p className="text-xs text-muted-foreground">Across all tables</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.length}</div>
              <p className="text-xs text-muted-foreground">Total users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chat Groups</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupsData.length}</div>
              <p className="text-xs text-muted-foreground">Active groups</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
            <CardDescription>Browse and query your database tables</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTable} onValueChange={setSelectedTable}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users">Users ({userData.length})</TabsTrigger>
                <TabsTrigger value="groups">Groups ({groupsData.length})</TabsTrigger>
                <TabsTrigger value="messages">Messages ({messagesData.length})</TabsTrigger>
              </TabsList>

              <div className="mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search records..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Record
                  </Button>
                </div>

                <TabsContent value="users" className="mt-0">
                  <div className="border rounded-lg overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No records found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}...</TableCell>
                              <TableCell className="font-medium">{user.display_name || "N/A"}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <span className="capitalize">{user.role || "user"}</span>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100">
                                  Active
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" title="View user details">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="groups" className="mt-0">
                  <div className="border rounded-lg overflow-auto">
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
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : filteredGroups.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              No groups found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredGroups.map((group) => (
                            <TableRow key={group.id}>
                              <TableCell className="font-mono text-xs">{group.id.substring(0, 8)}...</TableCell>
                              <TableCell className="font-medium">{group.name}</TableCell>
                              <TableCell>{group.description || "No description"}</TableCell>
                              <TableCell className="text-sm">
                                {new Date(group.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" title="View group">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="messages" className="mt-0">
                  <div className="border rounded-lg overflow-auto">
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
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : filteredMessages.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              No messages found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMessages.slice(0, 50).map((msg) => (
                            <TableRow key={msg.id}>
                              <TableCell className="font-mono text-xs">{msg.id.substring(0, 8)}...</TableCell>
                              <TableCell className="font-medium">{(msg as ChatMessage).group_name}</TableCell>
                              <TableCell className="max-w-md truncate">
                                {msg.message}
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(msg.created_at).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" title="View message">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    {filteredMessages.length > 50 && (
                      <div className="p-4 text-center text-sm text-muted-foreground border-t">
                        Showing first 50 of {filteredMessages.length} messages
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common database operations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="justify-start" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" className="justify-start" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => toast.info("Connected to Supabase")}>
              <DatabaseIcon className="mr-2 h-4 w-4" />
              Database Info
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
