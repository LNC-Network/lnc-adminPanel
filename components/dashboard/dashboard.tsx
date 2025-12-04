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
  ListTodo,
  CheckCircle,
  Users as UsersIcon,
  FolderLock,
  Calendar as CalendarIcon,
  BarChart3,
  Activity,
  Mail
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
  canAccessMailing,
} from "@/lib/permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
const ChatAnalytics = dynamic(() => import("./chat-analytics"));
const WebAnalytics = dynamic(() => import("./web-analytics"));
const Mailing = dynamic(() => import("./mailing"));
const Tickets = dynamic(() => import("./tickets"));
const ProjectEnv = dynamic(() => import("./project-env"));
const CalendarPage = dynamic(() => import("./calendar"));
const UserManagement = dynamic(() => import("./user-management"));

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
  const [chatUnseenCount, setChatUnseenCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
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
          const adminStatus = user.roles?.some((role: string) => role.toLowerCase().includes('admin'));
          setIsAdmin(adminStatus);
          if (adminStatus) {
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

  // Listen for chat unseen count updates
  useEffect(() => {
    const handleChatUnseenCount = (event: any) => {
      const newCount = event.detail.count || 0;
      setChatUnseenCount(newCount);
      // Immediately update notification count
      fetchNotifications();
    };

    window.addEventListener('chatUnseenCount', handleChatUnseenCount);
    return () => window.removeEventListener('chatUnseenCount', handleChatUnseenCount);
  }, []);

  // Re-calculate notification count when chatUnseenCount changes
  useEffect(() => {
    fetchNotifications();
  }, [chatUnseenCount]);

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

      // Update notification count (including chat unseen messages)
      setNotificationCount(usersCount + requestsCount + chatUnseenCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const isSuperAdminUser = isSuperAdmin(userRoles);
  const isAdmistaterUser = isAdmistater(userRoles);
  const canViewAllContent = canViewAll(userRoles);

  const canAccessProjectEnv = (roles: string[]) => {
    const allowedRoles = ["dev_member", "dev_admin", "super admin"];
    return roles.some(role => allowedRoles.includes(role));
  };

  const navigationItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "calendar", label: "Calendar", icon: CalendarIcon },
    { id: "content", label: "Content", icon: FileText },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "chat-analytics", label: "Chat Analytics", icon: BarChart3, requiresPermission: () => isSuperAdmin(userRoles) },
    { id: "web-analytics", label: "Web Analytics", icon: Activity, requiresPermission: () => isSuperAdmin(userRoles) },
    { id: "mailing", label: "Mailing Service", icon: Mail, requiresPermission: () => canAccessMailing(userRoles) },
    { id: "tickets", label: "Tickets", icon: ListTodo, requiresPermission: () => canAccessTickets(userRoles) },
    { id: "database", label: "Database", icon: DatabaseIcon, requiresPermission: () => canAccessDatabase(userRoles) },
    { id: "forms", label: "Forms", icon: FormInput },
    { id: "project-env", label: "Project ENV", icon: FolderLock, requiresPermission: () => canAccessProjectEnv(userRoles) },
    { id: "user-manage", label: "User Manage", icon: UsersIcon, requiresPermission: () => isSuperAdmin(userRoles) },
    { id: "settings", label: "Settings", icon: SettingsIcon },
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
                      <span className="absolute top-1 right-1 h-5 w-5 bg-gradient-to-r from-pink-400 to-fuchsia-400 rounded-full text-[10px] text-white flex items-center justify-center shadow-lg shadow-pink-400/30">
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
                      {chatUnseenCount > 0 && (
                        <div>
                          {(pendingUsers.length > 0 || joinRequests.length > 0) && <DropdownMenuSeparator />}
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Unread Chat Messages ({chatUnseenCount})
                          </div>
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentTab('chat');
                              setNotificationsOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="text-sm font-medium">
                                💬 You have {chatUnseenCount} unread message{chatUnseenCount > 1 ? 's' : ''}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Click to view your messages
                              </div>
                            </div>
                          </DropdownMenuItem>
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
                {/* Welcome Section */}
                <div className="flex flex-col gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Welcome back, {userEmail.split('@')[0] || 'Admin'}! 👋
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Here's what's happening with your admin panel today.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow active:scale-95" onClick={() => setCurrentTab('content')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Content
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">📝</div>
                      <p className="text-xs text-muted-foreground">
                        Manage your content
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow active:scale-95" onClick={() => setCurrentTab('chat')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Messages
                      </CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{chatUnseenCount}</div>
                      <p className="text-xs text-muted-foreground">
                        Unseen messages
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow active:scale-95" onClick={() => setCurrentTab('forms')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Forms
                      </CardTitle>
                      <FormInput className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">📋</div>
                      <p className="text-xs text-muted-foreground">
                        Create and manage forms
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Status
                      </CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-500">Online</div>
                      <p className="text-xs text-muted-foreground">
                        System operational
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {/* Quick Access */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Access</CardTitle>
                      <CardDescription>
                        Jump to commonly used sections
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <Button variant="outline" className="h-20 sm:h-24 flex-col gap-1 sm:gap-2 active:scale-95 transition-transform" onClick={() => setCurrentTab('settings')}>
                          <SettingsIcon className="h-5 w-5" />
                          <span className="text-xs sm:text-sm">Settings</span>
                        </Button>
                        <Button variant="outline" className="h-20 sm:h-24 flex-col gap-1 sm:gap-2 active:scale-95 transition-transform" onClick={() => setCurrentTab('chat')}>
                          <MessageSquare className="h-5 w-5" />
                          <span className="text-xs sm:text-sm">Chat</span>
                        </Button>
                        <Button variant="outline" className="h-20 sm:h-24 flex-col gap-1 sm:gap-2 active:scale-95 transition-transform" onClick={() => setCurrentTab('tickets')}>
                          <ListTodo className="h-5 w-5" />
                          <span className="text-xs sm:text-sm">Tickets</span>
                        </Button>
                        <Button variant="outline" className="h-20 sm:h-24 flex-col gap-1 sm:gap-2 active:scale-95 transition-transform" onClick={() => setCurrentTab('database')}>
                          <DatabaseIcon className="h-5 w-5" />
                          <span className="text-xs sm:text-sm">Database</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Profile</CardTitle>
                      <CardDescription>
                        Your account information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          <AvatarFallback className="text-base sm:text-lg">
                            {userEmail[0]?.toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{displayName || userEmail.split('@')[0]}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{userEmail}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full active:scale-95 transition-transform" onClick={() => setProfileDialogOpen(true)}>
                        <UserCircle className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Footer Info */}
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                      <div className="text-center sm:text-left">
                        <p className="text-xs sm:text-sm font-medium">LNC Admin Panel</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Version 2.0.0 • {new Date().getFullYear()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="gap-1 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Online
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentTab === "calendar" && <CalendarPage />}
            {currentTab === "content" && <Content />}
            {currentTab === "chat" && <Chat />}
            {currentTab === "chat-analytics" && isSuperAdmin(userRoles) && <ChatAnalytics />}
            {currentTab === "web-analytics" && isSuperAdmin(userRoles) && <WebAnalytics />}
            {currentTab === "mailing" && canAccessMailing(userRoles) && <Mailing />}
            {currentTab === "tickets" && canAccessTickets(userRoles) && <Tickets />}
            {currentTab === "database" && canAccessDatabase(userRoles) && <Database />}
            {currentTab === "forms" && <FormMaker />}
            {currentTab === "project-env" && <ProjectEnv userRole={userRoles[0] || ""} />}
            {currentTab === "user-manage" && isSuperAdmin(userRoles) && <UserManagement />}
            {currentTab === "settings" && <Settings />}
          </main>
        </div>
      </div>
    </>
  );
}
