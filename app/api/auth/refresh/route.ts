import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie");
  const refreshToken = cookie
    ?.split("; ")
    .find((c) => c.startsWith("refresh_token="))
    ?.split("=")[1];

  if (!refreshToken) {
    return NextResponse.json(
      { error: "No refresh token provided" },
      { status: 401 }
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Validate refresh token
    const { data: tokenRow, error: tokenErr } = await supabase
      .from("refresh_tokens")
      .select("user_id, expires_at")
      .eq("token", refreshToken)
      .single();

    if (tokenErr || !tokenRow) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Refresh token expired" },
        { status: 401 }
      );
    }

    const userId = tokenRow.user_id;

    // 2. Load user
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id, email, is_active")
      .eq("id", userId)
      .single();

    if (userErr || !user || !user.is_active) {
      return NextResponse.json({ error: "User disabled" }, { status: 403 });
    }

    // 3. Load roles
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("roles ( id, name )")
      .eq("user_id", user.id);

    const roles = rolesData?.map((r: any) => r.roles.name) ?? [];
    const roleIds = rolesData?.map((r: any) => r.roles.id) ?? [];

    // 4. Load permissions
    const { data: permsData } = await supabase
      .from("role_permissions")
      .select("permissions ( code )")
      .in("role_id", roleIds);

    const permissions = permsData?.map((p: any) => p.permissions.code) ?? [];

    // 5. Create new access token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        roles,
        permissions,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "10m" }
    );

    // 6. Rotate refresh token
    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const newExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

    // Delete old token
    await supabase.from("refresh_tokens").delete().eq("token", refreshToken);

    // Insert new token
    await supabase.from("refresh_tokens").insert({
      token: newRefreshToken,
      user_id: user.id,
      expires_at: newExpiry.toISOString(),
    });

    // 7. Response with updated cookies
    const response = NextResponse.json(
      {
        access_token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          roles,
          permissions,
        },
      },
      { status: 200 }
    );

    response.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      expires: newExpiry,
    });

    return response;
  } catch (err) {
    console.error("Refresh error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
