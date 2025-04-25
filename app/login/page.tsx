"use client";
import Image from "next/image";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default function LoginPage() {

  return (
    <>
      <Toaster closeButton richColors position="bottom-left" />
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
              <form className="flex flex-col gap-6" >
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      autoComplete="current-username"
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
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
    </>
  );
}
