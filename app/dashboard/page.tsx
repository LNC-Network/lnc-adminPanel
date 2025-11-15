"use client";

import DashboardClient from "@/components/dashboard/dashboard";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Verify user authentication
  const verifyUser = async () => {
    const token = Cookies.get("access_token");
    const refreshToken = Cookies.get("refresh_token");

    if (!token) {
      console.log("No token found, redirecting to login");
      router.replace("/login");
      return false;
    }

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        console.log("Token verification failed");
        
        // Try to refresh the token if we have a refresh token
        if (refreshToken) {
          console.log("Attempting to refresh token...");
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            
            // Update tokens
            Cookies.set("access_token", refreshData.access_token, {
              expires: 30,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            });
            
            Cookies.set("refresh_token", refreshData.refresh_token, {
              expires: 30,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            });
            
            localStorage.setItem("user", JSON.stringify(refreshData.user));
            console.log("Token refreshed successfully");
            return true;
          }
        }
        
        // If refresh failed or no refresh token, logout
        console.log("Token refresh failed, redirecting to login");
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        localStorage.removeItem("user");
        router.replace("/login");
        return false;
      }

      const data = await res.json();
      
      if (!data.success) {
        console.log("User not authenticated, redirecting to login");
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        localStorage.removeItem("user");
        router.replace("/login");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Verification error:", error);
      router.replace("/login");
      return false;
    }
  };

  useEffect(() => {
    // Initial verification
    const checkAuth = async () => {
      const isValid = await verifyUser();
      if (isValid) {
        setLoading(false);
      }
    };

    checkAuth();

    // Set up periodic verification every 15 minutes (900000ms)
    const intervalId = setInterval(async () => {
      console.log("Running periodic authentication check (every 15 minutes)");
      await verifyUser();
    }, 15 * 60 * 1000); // 15 minutes

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return <DashboardClient />;
}
