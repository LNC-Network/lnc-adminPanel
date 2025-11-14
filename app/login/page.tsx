import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginPage from "@/components/login-page";

export default async function Page() {
  const cookieStore = cookies();
  const token = (await cookieStore).get("access_token")?.value;

  if (token) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          cache: "no-store",
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          redirect("/dashboard");
        }
      }
    } catch (error) {
      console.error("Token verification error:", error);
      // Continue to show login page if verification fails
    }
  }

  return <LoginPage />;
}
