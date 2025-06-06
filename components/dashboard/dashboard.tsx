"use client";
import { useState, useRef, useEffect } from "react";
import ThemeSwitch from "../ThemeSwitch";
import Image from "next/image";
import { Bell /* , BellDot */, Logs } from "lucide-react";
import dynamic from "next/dynamic";
import Content from "./content";
import FormMaker from "./form-maker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = dynamic(() => import("./settings"));
const Database = dynamic(() => import("./database"));

export default function DashboardClient() {
  const [currentTab, setCurrentTab] = useState<string>(() => {
    // Load from sessionStorage on initial render
    return sessionStorage.getItem("currentTab") || "TAB1";
  });

  const [indicatorStyle, setIndicatorStyle] = useState<{
    width: number;
    left: number;
  }>({ width: 0, left: 0 });

  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const tabs = [
    { id: "TAB1", label: "Content", component: <Content /> },
    { id: "TAB2", label: "Database", component: <Database /> },
    { id: "TAB3", label: "Form", component: <FormMaker /> },
    { id: "TAB4", label: "Settings", component: <Settings /> },
  ];

  const tabSwitcher = (tab_name: string) => {
    if (currentTab === tab_name) return;
    setCurrentTab(tab_name);
    sessionStorage.setItem("currentTab", tab_name); // Save on switch
  };

  useEffect(() => {
    const currentTabRef = tabRefs.current[currentTab];
    if (currentTabRef) {
      const rect = currentTabRef.getBoundingClientRect();
      const parentRect = currentTabRef.parentElement?.getBoundingClientRect();
      if (parentRect) {
        setIndicatorStyle({
          width: rect.width,
          left: rect.left - parentRect.left,
        });
      }
    }
  }, [currentTab]);

  return (
    <Tabs defaultValue="account">
      <header className="flex justify-between h-16 items-center bg-muted px-4 w-full">
        <div className="flex items-center sm:gap-6 justify-between sm:justify-start w-full">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          {/* <BellDot /> */}
        </div>
        <div className="hidden sm:block">
          <ThemeSwitch />
        </div>
      </header>

      <TabsContent value="account">
        Make changes to your account here.
      </TabsContent>
      <TabsContent value="password">Change your password here.</TabsContent>
    </Tabs>
  );
}
