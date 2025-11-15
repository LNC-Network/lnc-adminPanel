<<<<<<< HEAD
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  const refreshToken = req.headers
    .get("cookie")
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
    const client = await pool.connect();

    // 1. Validate refresh token from DB
    const tokenRes = await client.query(
      `
      SELECT user_id, expires_at
      FROM refresh_tokens
      WHERE token = $1
      LIMIT 1
      `,
      [refreshToken]
    );

    const row = tokenRes.rows[0];

    if (!row) {
      client.release();
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    if (new Date(row.expires_at) < new Date()) {
      client.release();
      return NextResponse.json(
        { error: "Refresh token expired" },
        { status: 401 }
      );
    }

    const userId = row.user_id;

    // 2. Load user
    const userRes = await client.query(
      `SELECT id, email, is_active FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const user = userRes.rows[0];

    if (!user || !user.is_active) {
      client.release();
      return NextResponse.json({ error: "User disabled" }, { status: 403 });
    }

    // 3. Load roles
    const rolesRes = await client.query(
      `
      SELECT r.id, r.name
      FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = $1
      `,
      [user.id]
    );

    const roles = rolesRes.rows.map((r) => r.name);
    const roleIds = rolesRes.rows.map((r) => r.id);

    // 4. Load permissions
    const permsRes = await client.query(
      `
      SELECT p.code
      FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = ANY($1::uuid[])
      `,
      [roleIds]
    );

    const permissions = permsRes.rows.map((p) => p.code);

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
    const newExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 14 days

    // Delete old token and insert new one
    await client.query(`DELETE FROM refresh_tokens WHERE token = $1`, [
      refreshToken,
    ]);

    await client.query(
      `
      INSERT INTO refresh_tokens (token, user_id, expires_at)
      VALUES ($1, $2, $3)
      `,
      [newRefreshToken, user.id, newExpiry]
    );

    client.release();

    // 7. Prepare response
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
=======
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { refresh_token } = await req.json();

    if (!refresh_token) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { error: "Failed to refresh session" },
        { status: 401 }
      );
    }

    // Check user role
    const userRole = data.user.user_metadata?.role || 'user';
    
    if (userRole !== 'admin' && userRole !== 'editor') {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
>>>>>>> 2393e981e0d0e67d00f0e6a8172b3e80783a1bc1
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
