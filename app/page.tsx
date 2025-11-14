"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (data.success) {
          // Update user info in localStorage
          if (typeof window !== "undefined" && data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          }
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      } catch (error) {
        console.error("Verification error:", error);
        router.replace("/login");
      }
    };

    fetchData();
  }, [router]);

  return null;
}
