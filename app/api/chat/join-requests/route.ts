import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all pending join requests (for admins)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("group_id");

    let query = supabase
      .from("chat_join_requests")
      .select(`
        *,
        users(id, email, display_name),
        chat_groups(id, name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (groupId) {
      query = query.eq("group_id", groupId);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("Fetch join requests error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Format requests
    const formattedRequests = requests.map((req: any) => ({
      id: req.id,
      group_id: req.group_id,
      group_name: req.chat_groups?.name || "Unknown",
      user_id: req.user_id,
      user_name: req.users?.display_name || req.users?.email || "Unknown",
      user_email: req.users?.email || "Unknown",
      status: req.status,
      created_at: req.created_at,
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error("Get join requests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a join request
export async function POST(request: NextRequest) {
  try {
    const { group_id, user_id } = await request.json();

    if (!group_id || !user_id) {
      return NextResponse.json(
        { error: "Group ID and user ID are required" },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("chat_members")
      .select("id")
      .eq("group_id", group_id)
      .eq("user_id", user_id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this group" },
        { status: 400 }
      );
    }

    // Check if there's already a pending request
    const { data: existingRequest } = await supabase
      .from("chat_join_requests")
      .select("id")
      .eq("group_id", group_id)
      .eq("user_id", user_id)
      .eq("status", "pending")
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request for this group" },
        { status: 400 }
      );
    }

    // Create join request
    const { data, error } = await supabase
      .from("chat_join_requests")
      .insert({
        group_id,
        user_id,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Create join request error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      request: data,
    });
  } catch (error) {
    console.error("Create join request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Approve or reject a join request
export async function PATCH(request: NextRequest) {
  try {
    const { request_id, action } = await request.json();

    if (!request_id || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Request ID and valid action (approve/reject) are required" },
        { status: 400 }
      );
    }

    // Get the join request
    const { data: joinRequest, error: fetchError } = await supabase
      .from("chat_join_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (fetchError || !joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      // Add user to group
      const { error: memberError } = await supabase
        .from("chat_members")
        .insert({
          group_id: joinRequest.group_id,
          user_id: joinRequest.user_id,
        });

      if (memberError) {
        console.error("Add member error:", memberError);
        return NextResponse.json(
          { error: memberError.message },
          { status: 500 }
        );
      }
    }

    // Update request status
    const { error: updateError } = await supabase
      .from("chat_join_requests")
      .update({ status: action === "approve" ? "approved" : "rejected" })
      .eq("id", request_id);

    if (updateError) {
      console.error("Update request error:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Request ${action}d successfully`,
    });
  } catch (error) {
    console.error("Update join request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
