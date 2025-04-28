import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginPage from "@/components/login-page";

export default async function Page() {
  const cookieStore = cookies();
  const token = (await cookieStore).get("token")?.value;

  if (token) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
      }
    );

    const { success } = await res.json();
    if (success) {
      redirect("/dashboard");
    }
  }

  return <LoginPage />;
}
