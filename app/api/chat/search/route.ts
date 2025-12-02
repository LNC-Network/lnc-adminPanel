import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    // Search in messages
    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select(`
        id,
        message,
        created_at,
        users(email),
        chat_groups(name)
      `)
      .ilike("message", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (messagesError) throw messagesError;

    // Search in groups
    const { data: groups, error: groupsError } = await supabase
      .from("chat_groups")
      .select("id, name, description, created_at")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (groupsError) throw groupsError;

    // Search in users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, display_name")
      .or(`email.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    if (usersError) throw usersError;

    // Format messages for response
    const formattedMessages = messages?.map((msg: any) => ({
      id: msg.id,
      message: msg.message,
      user_email: msg.users?.email || "Unknown",
      group_name: msg.chat_groups?.name || "Unknown",
      created_at: msg.created_at,
    })) || [];

    return NextResponse.json({
      messages: formattedMessages,
      groups: groups || [],
      users: users || [],
      total: formattedMessages.length + (groups?.length || 0) + (users?.length || 0),
    });
  } catch (error: any) {
    console.error("Error searching chat:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}
