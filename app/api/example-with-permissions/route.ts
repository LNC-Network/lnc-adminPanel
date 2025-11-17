// Example API route demonstrating database permission checking
// This shows how to protect API endpoints using the permission system

import { NextResponse } from "next/server";
import { userHasPermission, PERMISSIONS } from "@/lib/permission-check";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Example: Get user by ID with permission check
 * Only users with 'user.read' permission can access this endpoint
 */
export async function GET(request: Request) {
  try {
    // 1. Extract user ID from session/token
    const userId = await getUserIdFromSession(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Check if user has permission to read user data
    const hasPermission = await userHasPermission(userId, PERMISSIONS.USER_READ);
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Permission denied: You don't have permission to view users" },
        { status: 403 }
      );
    }

    // 3. Get target user ID from query params
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get("id");
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // 4. Fetch user data
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, display_name, created_at")
      .eq("id", targetUserId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in GET /api/example/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Example: Create new user with permission check
 * Only users with 'user.create' permission can access this endpoint
 */
export async function POST(request: Request) {
  try {
    // 1. Extract user ID from session/token
    const userId = await getUserIdFromSession(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Check if user has permission to create users
    const hasPermission = await userHasPermission(userId, PERMISSIONS.USER_CREATE);
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Permission denied: Only Super Admin can create users" },
        { status: 403 }
      );
    }

    // 3. Get request body
    const body = await request.json();
    const { email, password, role } = body;

    // 4. Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 5. Create user (your existing logic)
    // ... user creation code ...

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/example/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Example: Update user with permission check
 * Only users with 'user.update' permission can access this endpoint
 */
export async function PATCH(request: Request) {
  try {
    const userId = await getUserIdFromSession(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const hasPermission = await userHasPermission(userId, PERMISSIONS.USER_UPDATE);
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Permission denied: You don't have permission to update users" },
        { status: 403 }
      );
    }

    // ... update logic ...

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error in PATCH /api/example/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Example: Delete user with permission check
 * Only users with 'user.delete' permission can access this endpoint
 */
export async function DELETE(request: Request) {
  try {
    const userId = await getUserIdFromSession(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const hasPermission = await userHasPermission(userId, PERMISSIONS.USER_DELETE);
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Permission denied: Only Super Admin can delete users" },
        { status: 403 }
      );
    }

    // ... delete logic ...

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/example/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Helper function to get user ID from session
 * Replace this with your actual session/auth logic
 */
async function getUserIdFromSession(request: Request): Promise<string | null> {
  try {
    // Example: Get from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return null;

    const token = authHeader.replace("Bearer ", "");
    
    // Verify token and extract user ID
    // This is a placeholder - implement your actual token verification
    // const { data, error } = await supabase.auth.getUser(token);
    // return data?.user?.id || null;

    // For now, you might get it from cookies or another method
    return null; // Replace with actual implementation
  } catch (error) {
    console.error("Error getting user from session:", error);
    return null;
  }
}
