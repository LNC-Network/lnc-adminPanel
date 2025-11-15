import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(request: NextRequest) {
  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validate role exists in roles table
    const { data: roleRow, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", role)
      .single();

    if (roleError || !roleRow) {
      return NextResponse.json(
        { error: "Invalid role: role does not exist" },
        { status: 400 }
      );
    }

    const roleId = roleRow.id;

    // Remove existing user roles (single-role model)
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to clear existing roles" },
        { status: 500 }
      );
    }

    // Insert new role entry
    const { error: insertError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role_id: roleId,
    });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to assign new role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Role updated successfully",
      role: role,
    });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
