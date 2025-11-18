"use client";
import { useState, useEffect } from "react";
import ThemeSwitch from "../ThemeSwitch";
import Image from "next/image";
import {
  Bell,
  LayoutDashboard,
  FileText,
  Database as DatabaseIcon,
  FormInput,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  User,
  Shield,
  UserCircle,
  KeyRound,
  MessageSquare,
  ListTodo
} from "lucide-react";
import dynamic from "next/dynamic";
import Content from "./content";
import FormMaker from "./form-maker";
import {
  isSuperAdmin,
  isAdmistater,
  canAccessDatabase,
  canAccessSettings,
  canAccessTickets,
  canViewAll,
} from "@/lib/permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const Settings = dynamic(() => import("./settings"));
const Database = dynamic(() => import("./database"));
const Chat = dynamic(() => import("./chat"));
const Tickets = dynamic(() => import("./tickets"));

export default function DashboardClient() {
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("currentTab") || "overview";
    }
    return "overview";
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
    router.replace("/login");
  };

  const handleUpdateProfile = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch("/api/users/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          display_name: displayName,
          password: newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Profile updated successfully");

        // Update localStorage
        if (typeof window !== "undefined") {
          const userData = localStorage.getItem("user");
          if (userData) {
            const user = JSON.parse(userData);
            user.display_name = displayName;
            localStorage.setItem("user", JSON.stringify(user));
          }
        }

        setProfileDialogOpen(false);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("currentTab", currentTab);
    }
  }, [currentTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUserRoles(user.roles || []);
          setUserEmail(user.email || "");
          setUserId(user.id || "");
          setDisplayName(user.display_name || "");

          // Fetch notifications if admin
          const isAdmin = user.roles?.some((role: string) => role.toLowerCase().includes('admin'));
          if (isAdmin) {
            fetchNotifications();
            // Poll for notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
          }
        } catch (e) {
          console.error("Failed to parse user data:", e);
        }
      }
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      let usersCount = 0;
      let requestsCount = 0;

      // Fetch pending user approvals
      const usersRes = await fetch('/api/users/pending');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const users = usersData.users || [];
        setPendingUsers(users);
        usersCount = users.length;
      }

      // Fetch chat join requests
      const joinRes = await fetch('/api/chat/join-requests');
      if (joinRes.ok) {
        const joinData = await joinRes.json();
        const requests = joinData.requests || [];
        setJoinRequests(requests);
        requestsCount = requests.length;
      }

      // Update notification count
      setNotificationCount(usersCount + requestsCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const isSuperAdminUser = isSuperAdmin(userRoles);
  const isAdmistaterUser = isAdmistater(userRoles);
  const canViewAllContent = canViewAll(userRoles);

  const navigationItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "content", label: "Content", icon: FileText },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "tickets", label: "Tickets", icon: ListTodo, requiresPermission: () => canAccessTickets(userRoles) },
    { id: "database", label: "Database", icon: DatabaseIcon, requiresPermission: () => canAccessDatabase(userRoles) },
    { id: "forms", label: "Forms", icon: FormInput },
    { id: "settings", label: "Settings", icon: SettingsIcon, requiresPermission: () => canAccessSettings(userRoles) },
  ].filter(item => {
    if (item.requiresPermission) return item.requiresPermission();
    return true;
  });

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`${mobile ? "w-full" : "w-64"
        } bg-muted/40 border-r border-muted min-h-screen p-4 flex flex-col`}
    >
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Image
            src="/avatars/shadcn.jpg"
            width={32}
            height={32}
            alt="logo"
            className="rounded-lg"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">LNC Admin</span>
          <span className="text-xs text-muted-foreground">Panel</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                if (mobile) setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentTab === item.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
                }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-muted">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar mobile />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex justify-between h-16 items-center bg-background border-b border-muted px-4 md:px-6">
            <div className="flex items-center gap-4">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>

              <h1 className="text-xl font-semibold">
                {navigationItems.find((item) => item.id === currentTab)?.label ||
                  "Dashboard"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <ThemeSwitch />
              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                      <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notificationCount === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No new notifications
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {pendingUsers.length > 0 && (
                        <div>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Pending User Approvals ({pendingUsers.length})
                          </div>
                          {pendingUsers.map((user: any) => (
                            <DropdownMenuItem
                              key={user.id}
                              onClick={() => {
                                setCurrentTab('overview');
                                setNotificationsOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col gap-1">
                                <div className="text-sm font-medium">{user.email}</div>
                                <div className="text-xs text-muted-foreground">
                                  Requested: {new Date(user.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      )}
                      {joinRequests.length > 0 && (
                        <div>
                          {pendingUsers.length > 0 && <DropdownMenuSeparator />}
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Chat Join Requests ({joinRequests.length})
                          </div>
                          {joinRequests.map((req: any) => (
                            <DropdownMenuItem
                              key={req.id}
                              onClick={() => {
                                setCurrentTab('chat');
                                setNotificationsOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col gap-1">
                                <div className="text-sm font-medium">{req.user_email}</div>
                                <div className="text-xs text-muted-foreground">
                                  Wants to join: {req.group_name}
                                </div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/shadcn.jpg" />
                      <AvatarFallback>{userEmail.substring(0, 2).toUpperCase() || "AD"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Account</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userEmail || "user@example.com"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Role: {userRoles.join(", ") || "No role assigned"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile Update Dialog */}
              <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your display name and password
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="display-name">Display Name</Label>
                      <Input
                        id="display-name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">New Password (optional)</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        disabled={!newPassword}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setProfileDialogOpen(false)}
                      disabled={updating}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateProfile} disabled={updating}>
                      {updating ? "Updating..." : "Save Changes"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
            {currentTab === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Users
                      </CardTitle>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4 text-muted-foreground"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">2,350</div>
                      <p className="text-xs text-muted-foreground">
                        +20.1% from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Content
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">845</div>
                      <p className="text-xs text-muted-foreground">
                        +15.3% from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Active Forms
                      </CardTitle>
                      <FormInput className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">23</div>
                      <p className="text-xs text-muted-foreground">
                        +5 new this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Database Size
                      </CardTitle>
                      <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12.4 GB</div>
                      <p className="text-xs text-muted-foreground">
                        +2.5 GB from last month
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="col-span-4">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Your recent actions in the admin panel
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          {
                            action: "Added new user",
                            time: "2 hours ago",
                            type: "user",
                          },
                          {
                            action: "Updated content item",
                            time: "4 hours ago",
                            type: "content",
                          },
                          {
                            action: "Created new form",
                            time: "1 day ago",
                            type: "form",
                          },
                          {
                            action: "Database backup completed",
                            time: "2 days ago",
                            type: "database",
                          },
                        ].map((activity, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                              {activity.type === "user" && (
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                              )}
                              {activity.type === "content" && (
                                <FileText className="h-4 w-4" />
                              )}
                              {activity.type === "form" && (
                                <FormInput className="h-4 w-4" />
                              )}
                              {activity.type === "database" && (
                                <DatabaseIcon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">
                                {activity.action}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {activity.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-3">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>
                        Common tasks and shortcuts
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => setCurrentTab("content")}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Add New Content
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => setCurrentTab("forms")}
                      >
                        <FormInput className="mr-2 h-4 w-4" />
                        Create Form
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => setCurrentTab("database")}
                      >
                        <DatabaseIcon className="mr-2 h-4 w-4" />
                        View Database
                      </Button>
                      {isSuperAdminUser && (
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => setCurrentTab("settings")}
                        >
                          <SettingsIcon className="mr-2 h-4 w-4" />
                          Manage Users
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {currentTab === "content" && <Content />}
            {currentTab === "chat" && <Chat />}
            {currentTab === "tickets" && canAccessTickets(userRoles) && <Tickets />}
            {currentTab === "database" && canAccessDatabase(userRoles) && <Database />}
            {currentTab === "forms" && <FormMaker />}
            {currentTab === "settings" && canAccessSettings(userRoles) && <Settings />}
          </main>
        </div>
      </div>
    </>
  );
}
