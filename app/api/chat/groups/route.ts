import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const isAdmin = searchParams.get("is_admin") === "true";

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // For all users (including admins), return only groups they're members of
    const { data: memberGroups, error } = await supabase
      .from("chat_members")
      .select(`
        group_id,
        chat_groups(
          id,
          name,
          description,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", userId);

    if (error) {
      console.error("Fetch groups error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Extract and format groups
    const groups = memberGroups
      .map((item: any) => item.chat_groups)
      .filter((group: any) => group !== null)
      .sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

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

    // Add creator and selected members to group
    const memberIds = member_ids && member_ids.length > 0 ? member_ids : [];
    
    // Ensure creator is always a member (add if not already in the list)
    if (userId && !memberIds.includes(userId)) {
      memberIds.push(userId);
    }

    if (memberIds.length > 0) {
      const members = memberIds.map((user_id: string) => ({
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
