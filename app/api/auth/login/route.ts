import { NextResponse } from "next/server";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    const client = await pool.connect();

    // 1. Fetch user
    const userRes = await client.query(
      `SELECT id, email, password_hash, is_active FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    const user = userRes.rows[0];
    if (!user) {
      client.release();
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      client.release();
      return NextResponse.json({ error: "User disabled" }, { status: 403 });
    }

    // 2. Verify password
    // const ok = await argon2.verify(user.password_hash, password);
    const ok = user.password_hash === password; // For demo purposes only; replace with argon2 in production
    if (!ok) {
      client.release();
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 3. Load roles
    const rolesRows = await client.query(
      `SELECT r.id, r.name
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );
    const roles = rolesRows.rows.map((r) => r.name);
    const roleIds = rolesRows.rows.map((r) => r.id);

    // 4. Load permissions
    const permsRows = await client.query(
      `SELECT p.code
       FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = ANY($1::uuid[])`,
      [roleIds]
    );
    const permissions = permsRows.rows.map((p) => p.code);

    // 5. Generate Access Token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        roles,
        permissions,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "10m" } // short expiry
    );

    // 6. Generate Refresh Token
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 14 days

    // Store refresh token
    await client.query(
      `
      INSERT INTO refresh_tokens (token, user_id, expires_at)
      VALUES ($1, $2, $3)
      `,
      [refreshToken, user.id, refreshExpiry]
    );

    client.release();

    // 7. Set refresh token cookie
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

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      expires: refreshExpiry,
    });

<<<<<<< HEAD
    return response;
  } catch (err) {
    console.error("Login error:", err);
=======
    if (authError) {
      return NextResponse.json(
        { error: authError.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!authData.session || !authData.user) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 401 }
      );
    }

    // Step 2: Get user role from profiles table
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', authData.user.id)
      .single();

    // Fallback to user_metadata if profile doesn't exist
    const userRole = profileData?.role || authData.user.user_metadata?.role || 'user';

    // Debug logging
    console.log('Login attempt:', {
      email: authData.user.email,
      userId: authData.user.id,
      profileRole: profileData?.role,
      metadataRole: authData.user.user_metadata?.role,
      finalRole: userRole
    });

    // Step 3: Check if user has valid role (admin, editor, or user)
    if (userRole !== 'admin' && userRole !== 'editor' && userRole !== 'user') {
      console.log(`Access denied for user ${email} with role: ${userRole}`);
      return NextResponse.json(
        { error: `Access denied. Invalid role: '${userRole}'.` },
        { status: 403 }
      );
    }

    // Step 4: Return session tokens and user info
    return NextResponse.json({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: userRole,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
>>>>>>> 2393e981e0d0e67d00f0e6a8172b3e80783a1bc1
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
