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
    // List all users using Admin API
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("Supabase Auth error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to list users" },
        { status: 400 }
      );
    }

    // Get additional profile data from profiles table
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, role");

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    // Merge user data with profile data
    const usersWithRoles = data.users.map((user) => {
      const profile = profiles?.find((p) => p.id === user.id);
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        user_metadata: {
          role: profile?.role || user.user_metadata?.role || "user",
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
