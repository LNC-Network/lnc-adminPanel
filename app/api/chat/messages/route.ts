import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("group_id");
    const userId = searchParams.get("user_id");

    if (!groupId || !userId) {
      return NextResponse.json(
        { error: "Group ID and User ID are required" },
        { status: 400 }
      );
    }

    // Check if user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from("chat_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Access denied: You are not a member of this group" },
        { status: 403 }
      );
    }

    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select(`
        *,
        users(email, display_name)
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fetch messages error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Format messages with user name and email
    const formattedMessages = messages.map((msg: any) => ({
      ...msg,
      user_name: msg.users?.display_name || msg.users?.email || "Unknown",
      user_email: msg.users?.email || "Unknown",
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { group_id, user_id, message } = await request.json();

    if (!group_id || !message || !user_id) {
      return NextResponse.json(
        { error: "Group ID, user ID, and message are required" },
        { status: 400 }
      );
    }

    // Check if user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from("chat_members")
      .select("id")
      .eq("group_id", group_id)
      .eq("user_id", user_id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Access denied: You are not a member of this group" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        group_id,
        user_id,
        message,
      })
      .select()
      .single();

    if (error) {
      console.error("Send message error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
