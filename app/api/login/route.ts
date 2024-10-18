import { NextResponse } from "next/server";
import credentials from "@/data/credentials.json";

export async function POST(request: Request) {
    const { email, password } = await request.json();

    if (email === credentials.email && password === credentials.password) {
        const token = "your-auth-token"; // Example token, can be JWT or a simple one
        return NextResponse.json({ success: true, token });
    }

    return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
}
