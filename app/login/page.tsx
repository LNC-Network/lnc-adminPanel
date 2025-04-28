"use client";
import Image from "next/image";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

import ThemeSwitch from "@/components/ThemeSwitch";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("token");

      if (!token) {
        return;
      }

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const { success } = await res.json();
      if (success) {
        router.replace("/dashboard");
      }
    };

    fetchData();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const token = await res.json();
      if (res.ok) {
        Cookies.set("token", token, {
          expires: 30,
          sameSite: "lax",
          /* secure: true, */
        });
        router.replace("/dashboard");
      } else {
        toast.error("Login failed");
      }
    } catch (err) {
      toast.error(`Login failed: ${err}`);
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

                  <Button type="submit" className="w-full">
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
