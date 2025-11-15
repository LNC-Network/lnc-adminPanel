import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Authenticate user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!authData.session || !authData.user) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 401 }
      );
    }

    // Step 2: Get user role from profiles table
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', authData.user.id)
      .single();

    // Fallback to user_metadata if profile doesn't exist
    const userRole = profileData?.role || authData.user.user_metadata?.role || 'user';

    // Debug logging
    console.log('Login attempt:', {
      email: authData.user.email,
      userId: authData.user.id,
      profileRole: profileData?.role,
      metadataRole: authData.user.user_metadata?.role,
      finalRole: userRole
    });

    // Step 3: Check if user has valid role (admin, editor, or user)
    if (userRole !== 'admin' && userRole !== 'editor' && userRole !== 'user') {
      console.log(`Access denied for user ${email} with role: ${userRole}`);
      return NextResponse.json(
        { error: `Access denied. Invalid role: '${userRole}'.` },
        { status: 403 }
      );
    }

    // Step 4: Return session tokens and user info
    return NextResponse.json({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: userRole,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
