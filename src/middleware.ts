import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip middleware for API routes and static files
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // 2. Create Supabase client and get session
  let response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. If not logged in, redirect to login (except if already on /login or /verify-institute-email)
  if (!user) {
    if (pathname === "/login" || pathname === "/verify-institute-email") {
      return response;
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. If logged in and on /login, redirect to dashboard
  // Note: Role-based routing is handled by AuthProvider in client
  // since we can't use Prisma in edge runtime
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/apply/:path*",
    "/track/:path*",
    "/certificate/:path*",
    "/login/:path*",
    "/verify-institute-email/:path*",
    "/history/:path*",
  ],
};