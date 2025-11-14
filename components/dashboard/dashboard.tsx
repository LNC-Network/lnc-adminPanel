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
  Menu
} from "lucide-react";
import dynamic from "next/dynamic";
import Content from "./content";
import FormMaker from "./form-maker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const Settings = dynamic(() => import("./settings"));
const Database = dynamic(() => import("./database"));

export default function DashboardClient() {
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem("currentTab") || "overview";
    }
    return "overview";
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
    router.replace("/login");
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("currentTab", currentTab);
    }
  }, [currentTab]);

  const navigationItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "content", label: "Content", icon: FileText },
    { id: "database", label: "Database", icon: DatabaseIcon },
    { id: "forms", label: "Forms", icon: FormInput },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`${mobile ? 'w-full' : 'w-64'} bg-muted/40 border-r min-h-screen p-4 flex flex-col`}>
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

      <div className="mt-auto pt-4 border-t">
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
        <header className="flex justify-between h-16 items-center bg-background border-b px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            <h1 className="text-xl font-semibold">
              {navigationItems.find(item => item.id === currentTab)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitch />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/shadcn.jpg" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
          {currentTab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
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
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">845</div>
                    <p className="text-xs text-muted-foreground">+15.3% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
                    <FormInput className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">23</div>
                    <p className="text-xs text-muted-foreground">+5 new this month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                    <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12.4 GB</div>
                    <p className="text-xs text-muted-foreground">+2.5 GB from last month</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your recent actions in the admin panel</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { action: "Added new user", time: "2 hours ago", type: "user" },
                        { action: "Updated content item", time: "4 hours ago", type: "content" },
                        { action: "Created new form", time: "1 day ago", type: "form" },
                        { action: "Database backup completed", time: "2 days ago", type: "database" },
                      ].map((activity, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            {activity.type === "user" && <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                            {activity.type === "content" && <FileText className="h-4 w-4" />}
                            {activity.type === "form" && <FormInput className="h-4 w-4" />}
                            {activity.type === "database" && <DatabaseIcon className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full justify-start" variant="outline" onClick={() => setCurrentTab("content")}>
                      <FileText className="mr-2 h-4 w-4" />
                      Add New Content
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setCurrentTab("forms")}>
                      <FormInput className="mr-2 h-4 w-4" />
                      Create Form
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setCurrentTab("database")}>
                      <DatabaseIcon className="mr-2 h-4 w-4" />
                      View Database
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setCurrentTab("settings")}>
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentTab === "content" && <Content />}
          {currentTab === "database" && <Database />}
          {currentTab === "forms" && <FormMaker />}
          {currentTab === "settings" && <Settings />}
        </main>
      </div>
    </div>
  );
}
