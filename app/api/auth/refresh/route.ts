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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
