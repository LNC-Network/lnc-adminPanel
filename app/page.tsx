"use client";
import { useState } from "react";
import { MdAdminPanelSettings } from "react-icons/md";
import { GrDatabase, GrAnalytics } from "react-icons/gr";
import { Top } from "@/components/ui/header";
import dynamic from "next/dynamic";

const DataBase = dynamic(() =>
  import("@/components/database").then((mod) => mod.default)
);
const Analytics = dynamic(() =>
  import("@/components/analytics").then((mod) => mod.default)
);
const Admin = dynamic(() =>
  import("@/components/admin").then((mod) => mod.default)
);

export default function App() {
  const [activeComponent, setActiveComponent] = useState("database");

  const renderComponent = () => {
    switch (activeComponent) {
      case "database":
        return (
          <>
            <Top heading="DataBase" />
            <DataBase />
          </>
        );
      case "admin":
        return (
          <>
            <Top heading="Admin Panel" />
            <Admin />
          </>
        );
      case "analytics":
        return (
          <>
            <Top heading="Analytics" />
            <Analytics />
          </>
        );
      default:
        return (
          <>
            <Top heading="DataBase" />
            <DataBase />
          </>
        );
    }
  };

  return (
    <div className="flex">
      {/* Side Panel */}
      <div className="pt-16 fixed h-full w-16 bg-slate-800 flex flex-col items-center py-4 space-y-8 text-white">
        <span
          className="hover:bg-gray-700 p-3 rounded-full cursor-pointer"
          onClick={() => setActiveComponent("database")}
        >
          <GrDatabase size={24} />
        </span>
        <span
          className="hover:bg-gray-700 p-3 rounded-full cursor-pointer"
          onClick={() => setActiveComponent("analytics")}
        >
          <GrAnalytics size={24} />
        </span>
        <span
          className="hover:bg-gray-700 p-3 rounded-full cursor-pointer"
          onClick={() => setActiveComponent("admin")}
        >
          <MdAdminPanelSettings size={24} />
        </span>
      </div>

      {/* Main Content */}
      <div className="ml-16 w-full">{renderComponent()}</div>
    </div>
  );
}
