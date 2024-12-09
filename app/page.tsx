"use client";
import { AppSidebar } from "@/components/app-sidebar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import React, { useEffect, useState } from "react";
import { useTheme } from "@/hooks/setTheme";

const Page = () => {
  // toggles search box______________
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  // theme
  const { theme, toggleTheme } = useTheme();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          {/* sidebar trigger */}
          <div className="flex items-center ml-4">
            <SidebarTrigger className="" />
            <CommandDialog open={open} onOpenChange={setOpen}>
              <CommandInput placeholder="Type a command or search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem>Calendar</CommandItem>
                  <CommandItem>Search Emoji</CommandItem>
                  <CommandItem>Calculator</CommandItem>
                </CommandGroup>
              </CommandList>
            </CommandDialog>
          </div>
          {/* search box */}
          <div className="relative flex justify-end items-center w-full mr-4">
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            <Input
              placeholder="Search"
              className="max-w-sm focus-visible:ring-0 pr-4"
              readOnly
              onClick={() => {
                setOpen(true);
              }}
            />
            <span className="absolute right-1 text-xs font-mono w-auto bg-secondary/95 px-2 py-1 border rounded-md hidden lg:block ">
              /
            </span>
          </div>
        </header>
        {/* main content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
export default Page;
