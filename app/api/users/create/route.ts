import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import argon2 from "argon2";
import { sendWelcomeEmail } from "@/lib/email-service";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, role = "user" } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["user", "editor", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be user, editor, or admin" },
        { status: 400 }
      );
    }

    // Hash password with argon2
    const password_hash = await argon2.hash(password);

    // Insert user into custom users table
    const { data, error } = await supabase
      .from("users")
      .insert({
        email,
        password_hash,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Failed to create user" },
        { status: 400 }
      );
    }

    // Get role ID
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", role)
      .single();

    if (roleError) {
      console.error("Role fetch error:", roleError);
    } else if (roleData) {
      // Assign role to user
      await supabase.from("user_roles").insert({
        user_id: data.id,
        role_id: roleData.id,
      });
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(data.email, data.display_name || data.email, role);
      console.log("Welcome email sent to:", data.email);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail user creation if email fails
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        email: data.email,
        role,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
