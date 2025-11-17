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
      .select("id, email, display_name, is_active, created_at, last_sign_in_at")
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

    // Group roles by user_id
    const rolesMap = new Map<string, string[]>();
    userRoles?.forEach((ur: any) => {
      if (!rolesMap.has(ur.user_id)) {
        rolesMap.set(ur.user_id, []);
      }
      rolesMap.get(ur.user_id)?.push(ur.roles.name);
    });

    // Merge user data with roles
    const usersWithRoles = users.map((user) => {
      const roles = rolesMap.get(user.id) || [];
      
      return {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at || null,
        user_metadata: {
          role: roles[0] || "user", // Keep for backward compatibility
        },
        roles: roles, // Array of all roles
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
