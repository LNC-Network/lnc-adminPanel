import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth callback error:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=auth_failed`
      );
    }

    if (data.session) {
      // Check user role
      const userRole = data.user.user_metadata?.role || "user";

      // If user doesn't have admin/editor role, set it to editor by default for Google OAuth
      if (userRole !== "admin" && userRole !== "editor") {
        // Update user metadata to set role as editor
        await supabase.auth.admin.updateUserById(data.user.id, {
          user_metadata: {
            role: "editor",
          },
        });
      }

      // Redirect to a page that will handle setting cookies
      const redirectUrl = new URL("/api/auth/set-session", requestUrl.origin);
      redirectUrl.searchParams.set("access_token", data.session.access_token);
      redirectUrl.searchParams.set("refresh_token", data.session.refresh_token);
      redirectUrl.searchParams.set("user", JSON.stringify(data.user));

      return NextResponse.redirect(redirectUrl);
    }
  }

  // If no code or error, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
