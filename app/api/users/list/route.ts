import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    // Get users from custom users table
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, display_name, is_active, created_at")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Users fetch error:", usersError);
      return NextResponse.json(
        { error: usersError.message || "Failed to fetch users" },
        { status: 400 }
      );
    }

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, roles(id, name)");

    if (rolesError) {
      console.error("Roles fetch error:", rolesError);
    }

    // Merge user data with roles
    const usersWithRoles = users.map((user) => {
      const roleData = userRoles?.find((ur) => ur.user_id === user.id);
      const roleName = roleData?.roles?.name || "user";
      
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: null, // Not tracked in custom table
        user_metadata: {
          role: roleName,
        },
      };
    });

    return NextResponse.json({
      success: true,
      users: usersWithRoles,
    });
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
