import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export function middleware(req: Request) {
    const token = req.cookies.get("auth-token");

    if (!isAuthenticated(token)) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"]
};
