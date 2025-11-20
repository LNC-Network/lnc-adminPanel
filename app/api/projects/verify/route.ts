import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// POST - Verify project password
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check user roles from JWT payload
    const roles = decoded.roles || [];
    const allowedRoles = ["dev_member", "dev_admin", "super admin"];
    
    if (!roles.some((role: string) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { projectId, password } = await req.json();

    if (!projectId || !password) {
      return NextResponse.json({ error: "Project ID and password are required" }, { status: 400 });
    }

    // Verify password
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("password")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.password !== password) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    return NextResponse.json({ 
      message: "Password verified",
      valid: true
    });
  } catch (error) {
    console.error("Error verifying password:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
