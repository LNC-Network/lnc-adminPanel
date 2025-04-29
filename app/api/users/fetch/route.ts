import { NextRequest, NextResponse } from "next/server";
import getUserTableData from "@/lib/getUserTableData"; // Adjust import path as needed

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = parseInt(searchParams.get("start") || "0", 10);
  const end = parseInt(searchParams.get("end") || "5", 15);

  const data = await getUserTableData(start, end);

  if (!data) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
