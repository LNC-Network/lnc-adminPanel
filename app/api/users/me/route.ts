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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Fetch user data - only select columns that exist
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, display_name, personal_email, team, is_active, created_at, last_sign_in_at")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Fetch user error:", userError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Try to get avatar_url separately (in case column doesn't exist)
    let avatarUrl = null;
    try {
      const { data: avatarData } = await supabase
        .from("users")
        .select("avatar_url")
        .eq("id", userId)
        .single();
      avatarUrl = avatarData?.avatar_url || null;
    } catch {
      // Column might not exist, ignore
    }

    // Fetch user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("roles(id, name)")
      .eq("user_id", userId);

    if (rolesError) {
      console.error("Roles fetch error:", rolesError);
    }

    // Extract role names
    const roles = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];

    return NextResponse.json({
      user: {
        ...user,
        avatar_url: avatarUrl,
        roles,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
