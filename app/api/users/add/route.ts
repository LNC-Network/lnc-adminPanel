import { NextRequest, NextResponse } from "next/server";
import setUserTableData from "@/lib/postgres/setUserTabledata";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body to get email and password
    const { email, password } = await req.json();

    // Validate that email and password are provided
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Call the function to insert the user data into the database
    const isSuccess = await setUserTableData(email, password);

    if (!isSuccess) {
      return NextResponse.json(
        { error: "Failed to save user data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
