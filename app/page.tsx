"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  return (
    <>
      <Button onClick={() => router.push("/login")}>Login</Button>
      <Button onClick={() => router.push("/dashboard")}>Dashboard</Button>
    </>
  );
}
