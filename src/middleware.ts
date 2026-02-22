import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip middleware for API routes and static files
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // 2. Read session from httpOnly JWT cookie
  const session = await getSessionFromRequest(request);

  // 3. If not logged in, redirect to login (except if already on /login or /verify-institute-email)
  if (!session) {
    if (pathname === "/login" || pathname === "/verify-institute-email") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. If logged in and on /login or /verify-institute-email, redirect to their dashboard
  if (pathname === "/login" || pathname === "/verify-institute-email") {
    if (session.role === "STUDENT") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(
      new URL(`/dashboard/staff/${session.role.toLowerCase()}`, request.url)
    );
  }

  // 5. Prevent Students from accessing Staff dashboards
  if (pathname.startsWith("/dashboard/staff") && session.role === "STUDENT") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 6. Prevent Staff from accessing Student-only pages (apply, track, certificate)
  const studentOnlyPaths = ["/apply", "/track", "/certificate"];
  if (
    studentOnlyPaths.some((p) => pathname.startsWith(p)) &&
    session.role !== "STUDENT"
  ) {
    return NextResponse.redirect(
      new URL(`/dashboard/staff/${session.role.toLowerCase()}`, request.url)
    );
  }

  // 7. Prevent non-Super-Admin from accessing Super Admin dashboard
  if (
    pathname.startsWith("/dashboard/staff/super_admin") &&
    session.role !== "SUPER_ADMIN"
  ) {
    if (session.role === "STUDENT") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(
      new URL(`/dashboard/staff/${session.role.toLowerCase()}`, request.url)
    );
  }

  // 8. Prevent Staff from accessing Student dashboard (/dashboard exactly)
  if (
    pathname === "/dashboard" &&
    session.role !== "STUDENT"
  ) {
    return NextResponse.redirect(
      new URL(`/dashboard/staff/${session.role.toLowerCase()}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/apply/:path*",
    "/track/:path*",
    "/certificate/:path*",
    "/login",
    "/verify-institute-email",
  ],
};