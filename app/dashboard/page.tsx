"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import DashboardClient from "@/components/dashboard/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const token = Cookies.get("access_token");

      if (!token) {
        // no access token → maybe expired → try refresh
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
        });

        if (!refreshRes.ok) {
          router.replace("/login");
          return;
        }

        const data = await refreshRes.json();
        Cookies.set("access_token", data.access_token);

        setLoading(false);
        return;
      }

      // verify token validity
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setLoading(false);
        return;
      }

      // token invalid → try refresh
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
      });

      if (!refreshRes.ok) {
        router.replace("/login");
        return;
      }

      const data = await refreshRes.json();
      Cookies.set("access_token", data.access_token);

      setLoading(false);
    };

    verify();
  }, [router]);

  if (loading) return null;

  return <DashboardClient />;
}
