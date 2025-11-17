import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendRoleChangedEmail } from "@/lib/email-service";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(request: Request) {
  try {
    const { userId, roles } = await request.json();

    console.log("PATCH /api/users/update-roles - Received:", { userId, roles });

    if (!userId || !roles || !Array.isArray(roles)) {
      return NextResponse.json(
        { error: "Missing userId or roles array" },
        { status: 400 }
      );
    }

    // Delete existing role assignments
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Failed to delete existing roles:", deleteError);
      return NextResponse.json(
        { error: "Failed to update roles" },
        { status: 500 }
      );
    }

    // If no roles selected, just return success (user has no roles)
    if (roles.length === 0) {
      console.log("All roles removed for user:", userId);
      return NextResponse.json({
        success: true,
        message: "All roles removed",
      });
    }

    // Get role IDs for the selected roles
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id, name")
      .in("name", roles);

    if (roleError || !roleData || roleData.length === 0) {
      console.error("Failed to fetch roles:", roleError);
      console.error("Requested roles:", roles);
      console.error("Found roles:", roleData);
      return NextResponse.json(
        { 
          error: "Roles not found in database. Please run INSERT-ROLES-NOW.sql in Supabase SQL Editor first.",
          requestedRoles: roles,
          foundRoles: roleData?.map(r => r.name) || []
        },
        { status: 404 }
      );
    }

    console.log("Found roles:", roleData);

    // Insert new role assignments
    const roleAssignments = roleData.map((role) => ({
      user_id: userId,
      role_id: role.id,
    }));

    const { error: insertError } = await supabase
      .from("user_roles")
      .insert(roleAssignments);

    if (insertError) {
      console.error("Failed to assign roles:", insertError);
      return NextResponse.json(
        { error: `Failed to assign roles: ${insertError.message}` },
        { status: 500 }
      );
    }

    console.log("Roles assigned successfully:", roles);

    // Get user email and name for notification
    const { data: userData } = await supabase
      .from("users")
      .select("email, display_name")
      .eq("id", userId)
      .single();

    // Send role changed email
    if (userData) {
      try {
        await sendRoleChangedEmail(
          userData.email,
          userData.display_name || userData.email,
          roles
        );
        console.log("Role change email sent to:", userData.email);
      } catch (emailError) {
        console.error("Failed to send role change email:", emailError);
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "User roles updated successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
