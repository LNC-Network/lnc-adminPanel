import { NextResponse } from "next/server";
import { isValidToken } from "@/lib/JWT";

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
    await isValidToken(token, secret);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 401 }
    );
  }
}
