import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required" },
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

    // Update user metadata
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          role,
        },
      }
    );

    if (authError) {
      console.error("Supabase Auth error:", authError);
      return NextResponse.json(
        { error: authError.message || "Failed to update user metadata" },
        { status: 400 }
      );
    }

    // Update profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
    });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
