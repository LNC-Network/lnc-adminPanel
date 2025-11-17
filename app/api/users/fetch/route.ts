import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const start = parseInt(searchParams.get("start") || "0", 10);
  const end = parseInt(searchParams.get("end") || "5", 10);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch users from the database
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, display_name, is_active, created_at")
    .range(start, end)
    .order("created_at", { ascending: false });

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  // Fetch user roles
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

  // Merge users with their roles
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
      roles: roles, // New: array of all roles
    };
  });

  return NextResponse.json({ data: usersWithRoles });
}
