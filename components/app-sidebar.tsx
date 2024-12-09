"use client";

import * as React from "react";
import {
  AudioWaveform,
  GalleryVerticalEnd,
  Settings2,
  Database,
  FileChartPie,
  Calendar,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// fetch data from server
const data = {
  user: {
    name: "Jit Debnath",
    email: "jit.nathdeb@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  Website: [
    {
      name: "LNC main",
      logo: GalleryVerticalEnd,
      plan: "",
    },
    {
      name: "LNC control panel",
      logo: AudioWaveform,
      plan: "",
    },
  ],
  navMain: [
    {
      title: "Database",
      url: "#",
      icon: Database,
      isActive: true,
      disableDropdown: true,
    },
    {
      title: "Stats",
      url: "#",
      icon: FileChartPie,
      disableDropdown: true,
    },
    {
      title: "Event Management",
      url: "#",
      icon: Calendar,
      disableDropdown: true,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      disableDropdown: true,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.Website} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
