import isUser from "@/lib/postgres/auth";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const authenticated = await isUser({ email, password });

  if (authenticated) {
    const token = jwt.sign({ email }, process.env.JWT_SECRET!, {
      expiresIn: "24h",
    });
    return NextResponse.json(token, { status: 200 });
  } else {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}
