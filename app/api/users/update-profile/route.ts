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

export async function PATCH(request: NextRequest) {
  try {
    const { userId, display_name, email, personal_email, password } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    // Update email if provided
    if (email !== undefined) {
      updateData.email = email;
    }

    // Update personal_email if provided
    if (personal_email !== undefined) {
      updateData.personal_email = personal_email;
    }

    // Update display name if provided
    if (display_name !== undefined) {
      updateData.display_name = display_name;
    }

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      updateData.password_hash = await argon2.hash(password);
    }

    // Update user in database
    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update profile" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
