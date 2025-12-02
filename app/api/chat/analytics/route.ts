import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get total messages
    const { count: totalMessages } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true });

    // Get total unique users
    const { data: users } = await supabase
      .from("chat_messages")
      .select("user_id")
      .order("user_id");
    
    const uniqueUsers = new Set(users?.map(u => u.user_id) || []);
    const totalUsers = uniqueUsers.size;

    // Get total groups
    const { count: totalGroups } = await supabase
      .from("chat_groups")
      .select("*", { count: "exact", head: true });

    // Get messages per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: messagesData } = await supabase
      .from("chat_messages")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString());

    const messagesPerDay: { [key: string]: number } = {};
    messagesData?.forEach((msg) => {
      const date = new Date(msg.created_at).toISOString().split("T")[0];
      messagesPerDay[date] = (messagesPerDay[date] || 0) + 1;
    });

    const messagesPerDayArray = Object.entries(messagesPerDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get top groups by message count
    const { data: groupMessages } = await supabase
      .from("chat_messages")
      .select("group_id, chat_groups(name)");

    const groupCounts: { [key: string]: { name: string; count: number } } = {};
    groupMessages?.forEach((msg: any) => {
      const groupName = msg.chat_groups?.name || "Unknown";
      if (!groupCounts[groupName]) {
        groupCounts[groupName] = { name: groupName, count: 0 };
      }
      groupCounts[groupName].count++;
    });

    const topGroups = Object.values(groupCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(g => ({ name: g.name, messageCount: g.count }));

    // Get most active users
    const { data: userMessages } = await supabase
      .from("chat_messages")
      .select("user_id, users(email)");

    const userCounts: { [key: string]: { email: string; count: number } } = {};
    userMessages?.forEach((msg: any) => {
      const email = msg.users?.email || "Unknown";
      if (!userCounts[email]) {
        userCounts[email] = { email, count: 0 };
      }
      userCounts[email].count++;
    });

    const activeUsers = Object.values(userCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(u => ({ email: u.email, messageCount: u.count }));

    // Get recent login activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: loginData } = await supabase
      .from("users")
      .select("email, last_sign_in_at")
      .not("last_sign_in_at", "is", null)
      .gte("last_sign_in_at", sevenDaysAgo.toISOString())
      .order("last_sign_in_at", { ascending: false })
      .limit(50);

    // Count login occurrences (approximation based on data)
    const recentLogins = loginData?.map((user: any) => ({
      email: user.email,
      lastLogin: user.last_sign_in_at,
      loginCount: 1, // This could be enhanced with actual login tracking
    })) || [];

    // Get users by role distribution
    const { data: usersWithRoles } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)");

    const roleCounts: { [key: string]: number } = {};
    usersWithRoles?.forEach((ur: any) => {
      const roleName = ur.roles?.name || "Unknown";
      roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
    });

    const usersByRole = Object.entries(roleCounts)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);

    // Get message types (text, image, file, etc.)
    const { data: allMessages } = await supabase
      .from("chat_messages")
      .select("message, image_url, file_url");

    const messageTypes: { [key: string]: number } = {
      "Text": 0,
      "Image": 0,
      "File": 0,
      "Text + Image": 0,
      "Other": 0
    };

    allMessages?.forEach((msg: any) => {
      if (msg.image_url && msg.message) {
        messageTypes["Text + Image"]++;
      } else if (msg.image_url) {
        messageTypes["Image"]++;
      } else if (msg.file_url) {
        messageTypes["File"]++;
      } else if (msg.message) {
        messageTypes["Text"]++;
      } else {
        messageTypes["Other"]++;
      }
    });

    const messageTypesArray = Object.entries(messageTypes)
      .map(([type, count]) => ({ type, count }))
      .filter(t => t.count > 0);

    const stats = {
      totalMessages: totalMessages || 0,
      totalUsers,
      totalGroups: totalGroups || 0,
      messagesPerDay: messagesPerDayArray,
      topGroups,
      activeUsers,
      messageTypes: messageTypesArray,
      recentLogins,
      usersByRole,
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error("Error fetching chat analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
