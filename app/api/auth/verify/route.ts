import { NextResponse } from "next/server";
import { jwtVerify } from "@/lib/protectPath";

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json(
      { success: false, error: "No token provided" },
      { status: 401 }
    );
  }

  try {
    const secret = process.env.JWT_SECRET!;
    const verified = await jwtVerify(token, secret);
    return NextResponse.json({ success: true, user: verified.payload });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 401 }
    );
  }
}
