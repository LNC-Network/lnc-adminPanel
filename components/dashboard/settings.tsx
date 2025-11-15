"use client";
import { Label } from "../ui/label";
import { Plus, Trash2, Shield, User as UserIcon } from "lucide-react";
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
import ThemeSwitch from "../ThemeSwitch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "../ui/sonner";
interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: {
    role?: string;
  };
}

export default function Settings() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  const clear = () => {
    setEmail("");
    setPassword("");
    setRole("user");
  };
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users/fetch?start=0&end=100");
      const json = await res.json();

      if (res.ok) {
        setUsers(json.data || []); // CHANGE: API returns { data }
      } else {
        toast.error(json.error || "Failed to fetch users");
      }
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    }
  };

  const addUser = async () => {
    if (!email || !password) {
      toast.warning("Email and password are required");
      return;
    }

    if (password.length < 6) {
      toast.warning("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/users/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`User created with ${role} role!`);
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

    try {
      const response = await fetch("/api/users/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }), // CHANGE: delete by email
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("User deleted");
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Failed to delete user");
      console.error(error);
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

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage users and system settings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>
              Add a new user to the admin panel with specific role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={loading}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        User (No admin access)
                      </div>
                    </SelectItem>
                    <SelectItem value="dev member">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Dev Member (Development team)
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Editor (Limited admin access)
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin (Full access)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={addUser} disabled={loading} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {loading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </CardContent>
        </Card>

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
                    <TableHead>Role</TableHead>
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
                          <Select
                            value={user.user_metadata?.role || "user"}
                            onValueChange={(newRole: string) =>
                              updateUserRole(user.id, newRole)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="dev member">Dev Member</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() =>
                              deleteUser(user.id, user.email || "")
                            }
                          >
                            <Trash2 className="h-4 w-4" />
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
      </div>
    </>
  );
}
