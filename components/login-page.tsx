"use client";
import Image from "next/image";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import ThemeSwitch from "@/components/ThemeSwitch";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid credentials");
        return;
      }

      // Store the access token (short-lived)
      Cookies.set("access_token", data.access_token, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: 0.5, // 12 hours max (your choice)
      });


      // Optional: store user in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      toast.success(`Welcome back, ${data.user.email}`);
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed. Please try again.");
    }
  };


  return (
    <>
      <Toaster closeButton richColors position="bottom-left" />
      <div className="fixed bottom-5 right-5 sm:left-5 sm:right-auto z-50">
        <ThemeSwitch />
      </div>

      <div className="flex h-screen w-screen">
        <div className="flex flex-col gap-4 p-6 md:p-10 flex-1">
          <div className="flex justify-center gap-2 md:justify-start">
            <Link href="/" className="flex items-center gap-2 font-medium">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Image
                  src="/avatars/shadcn.jpg"
                  width={20}
                  height={20}
                  alt="logo"
                />
              </div>
              LNC Admin Panel
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <form className="flex flex-col gap-6" onSubmit={handleLogin}>
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      autoComplete="username"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="mailto:jit.nathdeb@gmail.com?subject=Forgot%20password&body=Send%20details%20about%20you"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary">
                    Login
                  </Button>

                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="relative hidden w-1/2 bg-muted lg:block">
          <Image
            src="/login.webp"
            alt="Image"
            fill
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </>
  );
}
