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
import RegisterForm from "@/components/register-form";
import { UserPlus, ArrowRight, Loader2 } from "lucide-react";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
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
        setIsLoading(false);
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
      setIsLoading(false);
    }
  };


  return (
    <>
      <Toaster closeButton richColors position="bottom-right" theme="dark" />

      {/* Background is handled by layout, but we ensure z-index allows interaction */}
      <div className="flex min-h-screen w-full items-center justify-center p-4 relative z-10">

        {/* Animated Background Orbs (Optional enhancements to the ThreeJS bg) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
          <div className="absolute top-[20%] left-[20%] w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-accent/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        </div>

        <div className="w-full max-w-md animate-fade-in">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl">
            <div className="flex flex-col items-center gap-2 mb-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/50 mb-4 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                <Image
                  src="/icons/icon-192x192.svg"
                  width={32}
                  height={32}
                  alt="logo"
                  className="w-8 h-8"
                />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {showRegister ? "Create an Account" : "Welcome Back"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {showRegister ? "Enter your details to get started" : "Enter your credentials to access the admin panel"}
              </p>
            </div>

            {showRegister ? (
              <RegisterForm onBack={() => setShowRegister(false)} />
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-10"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="mailto:jit.nathdeb@gmail.com?subject=Forgot%20password"
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    className="bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-10"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {showRegister ? "Already have an account? " : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={() => setShowRegister(!showRegister)}
                className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
              >
                {showRegister ? "Sign in" : "Register now"}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-muted-foreground/50">
            <p>Protected by LNC Network Security</p>
          </div>
        </div>
      </div>
    </>
  );
}

