import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group_id = searchParams.get("group_id");

    if (!group_id) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    const { data: members, error } = await supabase
      .from("chat_members")
      .select(`
        user_id,
        joined_at,
        users:user_id (
          email
        )
      `)
      .eq("group_id", group_id)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Fetch members error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const formattedMembers = members.map((member: any) => ({
      user_id: member.user_id,
      email: member.users?.email || "Unknown",
      joined_at: member.joined_at,
    }));

    return NextResponse.json({ members: formattedMembers });
  } catch (error) {
    console.error("Fetch members error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { group_id, user_ids } = await request.json();

    if (!group_id || !user_ids || user_ids.length === 0) {
      return NextResponse.json(
        { error: "Group ID and user IDs are required" },
        { status: 400 }
      );
    }

    const members = user_ids.map((user_id: string) => ({
      group_id,
      user_id,
    }));

    const { error } = await supabase
      .from("chat_members")
      .insert(members);

    if (error) {
      console.error("Add members error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Members added successfully",
    });
  } catch (error) {
    console.error("Add members error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { group_id, user_id } = await request.json();

    if (!group_id || !user_id) {
      return NextResponse.json(
        { error: "Group ID and user ID are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("chat_members")
      .delete()
      .eq("group_id", group_id)
      .eq("user_id", user_id);

    if (error) {
      console.error("Remove member error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
