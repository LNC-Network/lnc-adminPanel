import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import argon2 from "argon2";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { display_name, email, personal_email, password, team } = await request.json();

    // Validate required fields
    if (!display_name || !email || !personal_email || !password || !team) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email ends with @lnc.com
    if (!email.endsWith("@lnc.com")) {
      return NextResponse.json(
        { error: "Email must be from @lnc.com domain" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists in users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Check if email already has a pending registration
    const { data: pendingUser } = await supabase
      .from("pending_users")
      .select("id, status")
      .eq("email", email)
      .single();

    if (pendingUser) {
      if (pendingUser.status === "pending") {
        return NextResponse.json(
          { error: "Registration already submitted and pending approval" },
          { status: 400 }
        );
      } else if (pendingUser.status === "rejected") {
        return NextResponse.json(
          { error: "Previous registration was rejected. Please contact admin." },
          { status: 400 }
        );
      }
    }

    // Hash password
    const password_hash = await argon2.hash(password);

    // Insert into pending_users table
    const { data, error } = await supabase
      .from("pending_users")
      .insert({
        display_name,
        email,
        personal_email,
        password_hash,
        team,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Registration error:", error);
      return NextResponse.json(
        { error: "Failed to submit registration" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registration submitted successfully. Please wait for admin approval.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
