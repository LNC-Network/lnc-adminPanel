"use client";
import { useState, useRef, useEffect } from "react";
import ThemeSwitch from "./ThemeSwitch";
import Image from "next/image";
export default function DashboardClient() {
  const [currentTab, setCurrentTab] = useState<string>("TAB1");
  const [indicatorStyle, setIndicatorStyle] = useState<{
    width: number;
    left: number;
  }>({ width: 0, left: 0 });
  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const tabs = [
    { id: "TAB1", label: "Content" },
    { id: "TAB2", label: "Database" },
    { id: "TAB3", label: "mmi" },
    { id: "TAB4", label: "Settings" },
  ];

  const tabSwitcher = (tab_name: string) => {
    if (currentTab === tab_name) return;
    setCurrentTab(tab_name);
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
    <>
      <header className="flex justify-between h-16 items-center bg-secondary px-4">
        <div className="flex items-center gap-4">
          <Image src="/logo.jpg" alt="Logo" width={20} height={20} />
          <p>USERNAME</p>
          <p>Logs</p>
        </div>
        <div className="hidden sm:block">
          <ThemeSwitch />
        </div>
      </header>

      {/* Tabs */}
      <div className="relative flex items-center gap-2  bg-secondary pb-2">
        {/* Sliding active background */}
        <div
          className="absolute top-[0px] sm:top-[1.5px] left-0 h-8 rounded-sm bg-primary transition-all duration-200 ease-in-out"
          style={{
            width: `${indicatorStyle.width}px`,
            transform: `translateX(${indicatorStyle.left}px)`,
          }}
        />

        {/* Tab Buttons */}
        {tabs.map((tab) => (
          <div
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            onClick={() => tabSwitcher(tab.id)}
            className={`relative z-10 cursor-pointer flex items-center justify-center px-4 h-8 text-sm rounded-md transition-colors${
              currentTab === tab.id ? "text-white" : "text-gray-400 "
            }`}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-3 p-4">
        {currentTab}
      </div>
    </>
  );
}
