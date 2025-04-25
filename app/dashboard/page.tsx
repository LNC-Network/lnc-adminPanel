"use client";

import DashboardClient from "@/components/dashboard";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // Track the loading state

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("token");

      if (!token) {
        console.error("No token found");
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const { success, error } = await res.json();

      if (!success) {
        console.error("Authentication error:", error);
        router.replace("/login");
      } else {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return <div></div>;
  }

  return <DashboardClient />;
}
