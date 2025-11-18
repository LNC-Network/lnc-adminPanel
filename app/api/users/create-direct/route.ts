import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import argon2 from "argon2";

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
    const { 
      display_name, 
      email, 
      personal_email, 
      password, 
      team, 
      roles = [] // Array of role names like ["Super Admin", "Admistater"]
    } = await request.json();

    // Validation
    if (!display_name || !email || !password) {
      return NextResponse.json(
        { error: "Display name, email, and password are required" },
        { status: 400 }
      );
    }

    if (!email.endsWith("@lnc.com")) {
      return NextResponse.json(
        { error: "Email must be from @lnc.com domain" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Hash password with argon2
    const password_hash = await argon2.hash(password);

    // Insert user into users table directly (no pending_users)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        display_name,
        email,
        personal_email: personal_email || null,
        password_hash,
        team: team || null,
        is_active: true, // Admin-created users are active immediately
      })
      .select()
      .single();

    if (userError) {
      console.error("Database error:", userError);
      if (userError.code === "23505") {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: userError.message || "Failed to create user" },
        { status: 400 }
      );
    }

    // Assign roles to user
    if (roles && roles.length > 0) {
      // Fetch role IDs for the specified role names
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id, name")
        .in("name", roles);

      if (roleError) {
        console.error("Role fetch error:", roleError);
      } else if (roleData && roleData.length > 0) {
        // Insert user_roles for each role
        const userRoles = roleData.map((role) => ({
          user_id: userData.id,
          role_id: role.id,
        }));

        const { error: userRoleError } = await supabase
          .from("user_roles")
          .insert(userRoles);

        if (userRoleError) {
          console.error("User role assignment error:", userRoleError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: userData.id,
        display_name: userData.display_name,
        email: userData.email,
        personal_email: userData.personal_email,
        team: userData.team,
        roles,
      },
    });
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
