import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all pending registrations
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("pending_users")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch pending users:", error);
      return NextResponse.json(
        { error: "Failed to fetch pending registrations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ pending_users: data || [] });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Approve or reject a pending registration
export async function PATCH(request: Request) {
  try {
    const { pending_user_id, action, reviewed_by, rejection_reason, role } = await request.json();

    console.log("PATCH /api/users/pending - Received:", {
      pending_user_id,
      action,
      reviewed_by,
      role,
      has_rejection_reason: !!rejection_reason
    });

    if (!pending_user_id || !action || !reviewed_by) {
      console.error("Missing required fields:", { pending_user_id, action, reviewed_by });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get pending user details
    const { data: pendingUser, error: fetchError } = await supabase
      .from("pending_users")
      .select("*")
      .eq("id", pending_user_id)
      .single();

    if (fetchError || !pendingUser) {
      return NextResponse.json(
        { error: "Pending user not found" },
        { status: 404 }
      );
    }

    if (pendingUser.status !== "pending") {
      return NextResponse.json(
        { error: "Registration already processed" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      console.log("Starting approval process for:", pendingUser.email);
      
      // Create user in users table
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          email: pendingUser.email,
          password_hash: pendingUser.password_hash,
          display_name: pendingUser.display_name,
        })
        .select()
        .single();

      if (userError) {
        console.error("Failed to create user:", userError);
        return NextResponse.json(
          { error: `Failed to create user account: ${userError.message}` },
          { status: 500 }
        );
      }

      console.log("User created successfully:", newUser.id);

      // Assign role to user (default to 'user' role if not specified)
      const assignedRole = role || "user";
      console.log("Assigning role:", assignedRole);
      
      // Get role ID
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("name", assignedRole)
        .single();

      if (roleError || !roleData) {
        console.error("Role not found:", assignedRole, roleError);
        return NextResponse.json(
          { error: `Role '${assignedRole}' not found. Please run verify-roles.sql` },
          { status: 500 }
        );
      }

      console.log("Role found, ID:", roleData.id);

      // Assign role to user
      const { error: assignError } = await supabase
        .from("user_roles")
        .insert({
          user_id: newUser.id,
          role_id: roleData.id,
        });

      if (assignError) {
        console.error("Failed to assign role:", assignError);
        return NextResponse.json(
          { error: `User created but failed to assign role: ${assignError.message}` },
          { status: 500 }
        );
      }

      console.log("Role assigned successfully");

      // Update pending user status
      const { error: updateError } = await supabase
        .from("pending_users")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by,
        })
        .eq("id", pending_user_id);

      if (updateError) {
        console.error("Failed to update pending user:", updateError);
      }

      console.log("Approval complete for:", pendingUser.email);

      return NextResponse.json({
        success: true,
        message: "User approved and account created",
        user: newUser,
      });
    } else {
      // Reject registration
      const { error: updateError } = await supabase
        .from("pending_users")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by,
          rejection_reason: rejection_reason || "Not specified",
        })
        .eq("id", pending_user_id);

      if (updateError) {
        console.error("Failed to reject registration:", updateError);
        return NextResponse.json(
          { error: "Failed to reject registration" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Registration rejected",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a pending registration record
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pending_user_id = searchParams.get("pending_user_id");

    if (!pending_user_id) {
      return NextResponse.json(
        { error: "Missing pending_user_id" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("pending_users")
      .delete()
      .eq("id", pending_user_id);

    if (error) {
      console.error("Failed to delete pending user:", error);
      return NextResponse.json(
        { error: "Failed to delete registration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Registration deleted",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
