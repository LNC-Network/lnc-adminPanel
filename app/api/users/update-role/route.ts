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

    // Get role ID
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", role)
      .single();

    if (roleError) {
      console.error("Role fetch error:", roleError);
      return NextResponse.json(
        { error: "Failed to find role" },
        { status: 400 }
      );
    }

    // Delete existing role assignment
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // Assign new role
    const { error: assignError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role_id: roleData.id,
      });

    if (assignError) {
      console.error("Role assignment error:", assignError);
      return NextResponse.json(
        { error: "Failed to update role" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Role updated successfully",
    });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
