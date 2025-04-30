"use client";

import DashboardClient from "@/components/dashboard/dashboard";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const success = await res.json();

      if (!success) {
        router.replace("/login");
      } else {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return null;
  }

  return <DashboardClient />;
}
