import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get unseen message count for user across all groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const groupId = searchParams.get("group_id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // If group_id is provided, get count for that group only
    if (groupId) {
      const { data, error } = await supabase.rpc("get_unseen_message_count", {
        p_user_id: userId,
        p_group_id: groupId,
      });

      if (error) {
        console.error("Error getting unseen count:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ count: data || 0 });
    }

    // Get unseen counts for all groups
    const { data: memberships, error: memberError } = await supabase
      .from("chat_members")
      .select("group_id, last_seen_at")
      .eq("user_id", userId);

    if (memberError) {
      console.error("Error getting memberships:", memberError);
      return NextResponse.json(
        { error: memberError.message },
        { status: 500 }
      );
    }

    // Get unseen count for each group
    const groupCounts = await Promise.all(
      (memberships || []).map(async (membership) => {
        const { data: count } = await supabase.rpc("get_unseen_message_count", {
          p_user_id: userId,
          p_group_id: membership.group_id,
        });

        return {
          group_id: membership.group_id,
          unseen_count: count || 0,
        };
      })
    );

    // Calculate total unseen messages
    const totalUnseen = groupCounts.reduce(
      (sum, group) => sum + group.unseen_count,
      0
    );

    return NextResponse.json({
      total_unseen: totalUnseen,
      groups: groupCounts,
    });
  } catch (error) {
    console.error("Error in unseen messages GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Mark messages as seen (update last_seen_at)
export async function POST(request: NextRequest) {
  try {
    const { user_id, group_id } = await request.json();

    if (!user_id || !group_id) {
      return NextResponse.json(
        { error: "User ID and Group ID are required" },
        { status: 400 }
      );
    }

    // Update last_seen_at to current timestamp
    const { error } = await supabase
      .from("chat_members")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("user_id", user_id)
      .eq("group_id", group_id);

    if (error) {
      console.error("Error updating last_seen_at:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Messages marked as seen",
    });
  } catch (error) {
    console.error("Error in unseen messages POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
