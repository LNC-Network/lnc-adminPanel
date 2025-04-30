"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

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
      router.replace(success ? "/dashboard" : "/login");
    };

    fetchData();
  }, [router]);

  return null;
}
