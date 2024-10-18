"use client";
import { useState } from "react";
import Admin from "@/components/admin";
import DataBase from "@/components/database";
import Analytics from "@/components/analytics";
import { MdAdminPanelSettings } from "react-icons/md";
import { GrDatabase, GrAnalytics } from "react-icons/gr";

export default function App() {
  const [activeComponent, setActiveComponent] = useState("database");

  const renderComponent = () => {
    switch (activeComponent) {
      case "database":
        return <DataBase />;
      case "admin":
        return <Admin />;
      case "analytics":
        return <Analytics />;
      default:
        return <DataBase />;
    }
  };

  return (
    <div className="flex">
      <div className="pt-16 fixed h-full w-16 bg-slate-800 flex flex-col items-center py-4 text-white">
        {["database", "analytics", "admin"].map((item, idx) => (
          <span
            key={idx}
            className={`w-full h-16 flex justify-center items-center cursor-pointer transition-colors duration-300 ${
              activeComponent === item ? "bg-slate-700" : "hover:bg-slate-700"
            }`}
            onClick={() => setActiveComponent(item)}
          >
            {item === "database" && <GrDatabase size={24} />}
            {item === "analytics" && <GrAnalytics size={24} />}
            {item === "admin" && <MdAdminPanelSettings size={24} />}
          </span>
        ))}
      </div>
      <div className="ml-16 w-full">{renderComponent()}</div>
    </div>
  );
}
