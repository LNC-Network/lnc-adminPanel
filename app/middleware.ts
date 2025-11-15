import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const protectedPaths = ["/admin", "/dashboard", "/api/users"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip unprotected paths
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // 2. Try reading access token from cookies first
  const cookieToken = req.cookies.get("access_token")?.value;

  // 3. Or read from Authorization header (API clients)
  const headerAuth = req.headers.get("authorization");
  const headerToken = headerAuth?.startsWith("Bearer ")
    ? headerAuth.split(" ")[1]
    : null;

  const token = cookieToken || headerToken;

  if (!token) {
    // Redirect (for pages) and JSON error (for API routes)
    if (pathname.startsWith("/api"))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4. Verify token
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api"))
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    return NextResponse.redirect(new URL("/login", req.url));
  }
}

// Required for middleware
export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/api/users/:path*"],
};
