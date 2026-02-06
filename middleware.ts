import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const protectedPaths = ["/admin", "/dashboard", "/api/users"];

export async function middleware(req: NextRequest) {
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

  // 4. Verify token using jose (Edge-compatible)
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (err: any) {
    console.log("[Middleware] Token verification failed:", err.message);
    if (pathname.startsWith("/api"))
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    return NextResponse.redirect(new URL("/login", req.url));
  }
}

// Required for middleware
export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/api/users/:path*"],
};
