import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const cookie = req.headers.get("cookie");
    const refreshToken = cookie
      ?.split("; ")
      .find((c) => c.startsWith("refresh_token="))
      ?.split("=")[1];

    if (refreshToken) {
      // Delete refresh token from DB
      await supabase.from("refresh_tokens").delete().eq("token", refreshToken);
    }

    // Clear cookies
    const response = NextResponse.json(
      { success: true, message: "Logged out" },
      { status: 200 }
    );

    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
    });

    response.cookies.set("access_token", "", {
      httpOnly: false,
      secure: true,
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
