import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

<<<<<<< HEAD
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
=======
    // Get user role from profiles table (primary source)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Use role from profiles table, fallback to user_metadata
    const userRole = profileData?.role || user.user_metadata?.role || 'user';
    
    if (userRole !== 'admin' && userRole !== 'editor' && userRole !== 'user') {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }
>>>>>>> 2393e981e0d0e67d00f0e6a8172b3e80783a1bc1

    return NextResponse.json({ valid: true, user: decoded }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { valid: false, error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
