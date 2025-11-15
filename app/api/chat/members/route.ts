import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
