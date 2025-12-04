import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/google/callback";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard?google_error=${error}`, process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard?google_error=missing_params", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error("Token exchange error:", tokens);
      return NextResponse.redirect(
        new URL(`/dashboard?google_error=${tokens.error}`, process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Store tokens in database
    const { error: dbError } = await supabase
      .from("google_calendar_tokens")
      .upsert({
        user_id: state,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.redirect(
        new URL("/dashboard?google_error=db_error", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    return NextResponse.redirect(
      new URL("/dashboard?google_connected=true", process.env.NEXT_PUBLIC_APP_URL!)
    );
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?google_error=server_error", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
}
