import { NextResponse } from "next/server";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function envCheck() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwt: process.env.JWT_SECRET,
  };
}

export async function POST(req: Request) {
  const { url, key, jwt: jwtSecret } = envCheck();
  if (!url || !key || !jwtSecret) {
    console.error("ENV MISSING", { url, key: !!key, jwt: !!jwtSecret });
    return NextResponse.json(
      { error: "Server misconfigured (missing env vars)" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const email = body?.email;
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient(url, key);

    // 1) fetch user
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id, email, password_hash, is_active")
      .eq("email", email)
      .maybeSingle();

    if (userErr) {
      console.error("Supabase user fetch error:", userErr);
      return NextResponse.json(
        { error: "Internal server error (user fetch)" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "User disabled" }, { status: 403 });
    }

    const stored = user.password_hash;

    if (!stored || typeof stored !== "string") {
      console.error("Missing password_hash for user:", user.id);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 2) verify password
    let passwordOk = false;
    try {
      // argon2 hashes start with `$argon2`
      if (stored.startsWith("$argon2")) {
        passwordOk = await argon2.verify(stored, password);
      } else {
        // Fallback for legacy plaintext (not recommended) — treat as invalid by default.
        // If you intentionally have plaintext hashes for development, compare directly:
        // passwordOk = stored === password;
        console.warn(
          "Password hash for user does not appear to be argon2. Rejecting for safety.",
          user.id
        );
        passwordOk = false;
      }
    } catch (verifyErr) {
      console.error("argon2 verify error:", verifyErr);
      return NextResponse.json(
        { error: "Internal server error (password verify)" },
        { status: 500 }
      );
    }

    if (!passwordOk) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 3) load roles
    const { data: rolesData, error: rolesErr } = await supabase
      .from("user_roles")
      .select("roles ( id, name )")
      .eq("user_id", user.id);

    if (rolesErr) {
      console.error("roles fetch error:", rolesErr);
      return NextResponse.json(
        { error: "Internal server error (roles)" },
        { status: 500 }
      );
    }

    const roles = (rolesData ?? [])
      .map((r: any) => r.roles?.name)
      .filter(Boolean);
    const roleIds = (rolesData ?? [])
      .map((r: any) => r.roles?.id)
      .filter(Boolean);

    // 4) load permissions
    let permissions: string[] = [];
    if (roleIds.length > 0) {
      const { data: permsData, error: permsErr } = await supabase
        .from("role_permissions")
        .select("permissions ( code )")
        .in("role_id", roleIds);

      if (permsErr) {
        console.error("permissions fetch error:", permsErr);
        return NextResponse.json(
          { error: "Internal server error (permissions)" },
          { status: 500 }
        );
      }

      permissions = (permsData ?? [])
        .map((p: any) => p.permissions?.code)
        .filter(Boolean);
    }

    // 5) create access token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        roles,
        permissions,
      },
      jwtSecret,
      { expiresIn: "10m" }
    );

    // 6) create refresh token & store
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 14 days

    const { error: insertErr } = await supabase.from("refresh_tokens").insert({
      token: refreshToken,
      user_id: user.id,
      expires_at: refreshExpiry.toISOString(),
    });

    if (insertErr) {
      console.error("refresh token insert error:", insertErr);
      return NextResponse.json(
        { error: "Internal server error (store refresh token)" },
        { status: 500 }
      );
    }

    // 7) prepare response and set cookies (access_token cookie readable by client for middleware)
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

    // access_token cookie: NOT httpOnly so client-side code / middleware can read if needed.
    response.cookies.set("access_token", accessToken, {
      httpOnly: false,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 10, // 10 minutes in seconds
    });

    // refresh_token cookie: httpOnly
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      expires: refreshExpiry,
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
