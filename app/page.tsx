"use client";
import { useState } from "react";
import Admin from "@/components/admin";
import DataBase from "@/components/database";
import Analytics from "@/components/analytics";
import { MdAdminPanelSettings } from "react-icons/md";
import { GrDatabase, GrAnalytics } from "react-icons/gr";

export default function App() {
  // State to track which component is active
  const [activeComponent, setActiveComponent] = useState("database");

  // Function to render the selected component
  const renderComponent = () => {
    switch (activeComponent) {
      case "database":
        return <DataBase />;
      case "admin":
        return <Admin />;
      case "analytics":
        return <Analytics />; // Placeholder, replace with actual component
      default:
        return <DataBase />;
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
