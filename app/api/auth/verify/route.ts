import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body?.token;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { valid: false, error: "Missing or invalid token" },
        { status: 400 }
      );
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    // Token is valid
    return NextResponse.json({ valid: true, user: decoded }, { status: 200 });
  } catch (err: any) {
    const msg =
      err?.name === "TokenExpiredError" ? "Token expired" : "Invalid token";

    return NextResponse.json({ valid: false, error: msg }, { status: 401 });
  }
}
