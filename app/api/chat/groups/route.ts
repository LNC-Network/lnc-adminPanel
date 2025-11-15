import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Return all groups so users can see them
    const { data: groups, error } = await supabase
      .from("chat_groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch groups error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Get groups error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, member_ids } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    // Get current user from token or session
    const userData = request.headers.get("user-data");
    const userId = userData ? JSON.parse(userData).id : null;

    // Create group
    const { data: group, error: groupError } = await supabase
      .from("chat_groups")
      .insert({
        name,
        description,
        created_by: userId,
      })
      .select()
      .single();

    if (groupError) {
      console.error("Create group error:", groupError);
      return NextResponse.json(
        { error: groupError.message },
        { status: 500 }
      );
    }

    // Add members to group
    if (member_ids && member_ids.length > 0) {
      const members = member_ids.map((user_id: string) => ({
        group_id: group.id,
        user_id,
      }));

      const { error: membersError } = await supabase
        .from("chat_members")
        .insert(members);

      if (membersError) {
        console.error("Add members error:", membersError);
      }
    }

    return NextResponse.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
