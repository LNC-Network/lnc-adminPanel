import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNewGroupNotification } from "@/lib/chat-email-service";

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

    // Fetch all groups
    const { data: allGroups, error: groupsError } = await supabase
      .from("chat_groups")
      .select("id, name, description, created_by, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (groupsError) {
      console.error("Fetch groups error:", groupsError);
      return NextResponse.json(
        { error: groupsError.message },
        { status: 500 }
      );
    }

    // Fetch user's memberships to mark which groups they belong to
    const { data: memberGroups } = await supabase
      .from("chat_members")
      .select("group_id")
      .eq("user_id", userId);

    const memberGroupIds = new Set(memberGroups?.map((m: any) => m.group_id) || []);

    // Add is_member flag to each group
    const groups = allGroups.map((group: any) => ({
      ...group,
      is_member: memberGroupIds.has(group.id),
    }));

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

      // Send email notifications to all members
      const { data: memberUsers } = await supabase
        .from("users")
        .select("id, email, personal_email, display_name")
        .in("id", memberIds);

      const { data: creator } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (memberUsers && creator) {
        // Send notifications asynchronously (don't wait for them)
        memberUsers.forEach(async (member) => {
          try {
            await sendNewGroupNotification({
              recipientEmail: member.personal_email || member.email,
              recipientName: member.display_name || member.email,
              groupName: name,
              groupDescription: description,
              createdBy: creator.email,
            });
          } catch (error) {
            console.error(`Failed to send notification to ${member.email}:`, error);
          }
        });
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
