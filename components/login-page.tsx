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
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { UserPlus, ArrowRight, Loader2 } from "lucide-react";
import ParticleCanvas from "@/components/ParticleCanvas";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
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
        credentials: "include", // Important: include cookies in request/response
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid credentials");
        return;
      }

      // Set cookie client-side as backup (server also sets it)
      Cookies.set("access_token", data.access_token, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: 0.5,
        path: "/",
      });

      // Verify cookie was set
      const cookieCheck = Cookies.get("access_token");
      console.log("Cookie set:", !!cookieCheck, "Token length:", cookieCheck?.length);

      // Optional: store user in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      toast.success(`Welcome back, ${data.user.email}`);

      // Force redirect to dashboard - return early to prevent finally from interfering
      console.log("Redirecting now...");
      window.location.href = "/dashboard";
      return; // Prevent further code execution
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getHeaderText = () => {
    if (showForgotPassword) return "Reset Password";
    if (showRegister) return "Create an Account";
    return "Welcome Back";
  };

  const getSubHeaderText = () => {
    if (showForgotPassword) return "Securely reset your admin access";
    if (showRegister) return "Enter your details to get started";
    return "Enter your credentials to access the admin panel";
  };

  return (
    <>
      <Toaster closeButton richColors position="bottom-right" theme="dark" />

      {/* Split Screen Layout */}
      <div className="flex min-h-screen w-full">
        {/* Left Side: Particle Animation (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          {/* Animated Background Orbs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[20%] left-[20%] w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-accent/20 rounded-full blur-[100px] animate-pulse delay-1000" />
          </div>
          <ParticleCanvas />
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative">
          {/* Animated Background Orbs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[20%] left-[20%] w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-accent/20 rounded-full blur-[100px] animate-pulse delay-1000" />
          </div>

          <div className="w-full max-w-md animate-fade-in z-10">
            <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl bg-black/95 sm:bg-black/70 sm:backdrop-blur-xl">
              <div className="flex flex-col items-center gap-2 mb-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/50 mb-4 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                  <Image
                    src="/android-chrome-192x192.png"
                    width={32}
                    height={32}
                    alt="logo"
                    className="w-8 h-8"
                  />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {getHeaderText()}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {getSubHeaderText()}
                </p>
              </div>

              {showForgotPassword ? (
                <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
              ) : showRegister ? (
                <RegisterForm onBack={() => setShowRegister(false)} />
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@lnc.com"
                      required
                      className="bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-10"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      className="bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-10"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
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
      </div>
    </>
  );
}
