import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/callback
 * Handles the OAuth callback from Supabase/Google.
 *
 * Flow:
 * 1. Exchange the code for a Supabase session (auth is now handled by Supabase)
 * 2. Get the authenticated user from Supabase
 * 3. Check if user exists in Prisma by Supabase UID
 * 4. If new user, classify by email domain and redirect to verify page
 * 5. If existing user, redirect based on profile completeness
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const origin = url.origin;

    if (!code) {
      console.error("No authorization code in callback");
      return NextResponse.redirect(
        new URL("/login?error=no_code", origin)
      );
    }

    const cookieStore = await cookies();
    let response = NextResponse.next();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Exchange the authorization code for a session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !sessionData.user) {
      console.error("Callback session error:", sessionError?.message || "Unknown error");
      return NextResponse.redirect(
        new URL("/login?error=callback_failed", origin)
      );
    }

    const authUser = sessionData.user;
    const supabaseUid = authUser.id; // Supabase user ID (UUID)
    const googleEmail = authUser.email!;
    const googleName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      googleEmail.split("@")[0];
    const avatarUrl =
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      null;

    console.log("🔐 Callback received for email:", googleEmail, "UID:", supabaseUid);

    // -----------------------------------------------------------
    // 1. Check if user exists in Prisma by Supabase UID
    // -----------------------------------------------------------
    let existingUser = await prisma.user.findUnique({
      where: { id: supabaseUid },
    });

    if (existingUser) {
      console.log("✅ User found by Supabase UID:", existingUser.email);
      // User fully registered — sign in and redirect
      const redirectPath = getRedirectPath(existingUser.role);
      response = NextResponse.redirect(new URL(redirectPath, origin));
      return response;
    }

    // Also check by email in case they were created before UID migration
    existingUser = await prisma.user.findUnique({
      where: { email: googleEmail.toLowerCase().trim() },
    });

    if (existingUser) {
      console.log("⚠️  User found by email but different UID. Existing UID:", existingUser.id, "New UID:", supabaseUid);
      // Update avatar if available
      if (avatarUrl && !existingUser.avatarUrl) {
        existingUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            avatarUrl: avatarUrl,
          },
        });
      }
      const redirectPath = getRedirectPath(existingUser.role);
    // -----------------------------------------------------------
    // 2. New user — classify by email domain
    //    @mitsgwl.ac.in  → STUDENT
    //    @mitsgwl.com    → FACULTY
    //    anything else   → external (must provide institute email)
    // -----------------------------------------------------------
    const emailLower = googleEmail.toLowerCase().trim();
    const domain = emailLower.split("@")[1]; // e.g. "mitsgwl.ac.in", "gmail.com"

    let userType: "student" | "faculty" | "external";

    if (domain === "mitsgwl.ac.in") {
      userType = "student";
    } else if (domain === "mitsgwl.com") {
      userType = "faculty";
    } else {
      // Non-institute email — user must provide their institute email
      userType = "external";
    }

    console.log("📝 New user detected. Type:", userType, "Domain:", domain);

    // -----------------------------------------------------------
    // 3. Redirect to profile-completion page with Google data
    //    in a short-lived httpOnly cookie
    // -----------------------------------------------------------
    const googleData = JSON.stringify({
      supabaseUid,
      googleEmail,
      googleName,
      avatarUrl,
    });

    response = NextResponse.redirect(
      new URL(`/verify-institute-email?type=${userType}`, origin)
    );

    response.cookies.set("pending_google_auth", googleData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 minutes — enough time to fill the form
    });

    return response;
  } catch (error) {
    console.error("❌ Callback route error:", error);
    return NextResponse.json(
      { code: 500, error_code: "callback_error", msg: String(error) },
      { status: 500 }
    );
  }
}

// ─── Helper ───────────────────────────────────────────────────
function getRedirectPath(role: string) {
  if (role === "STUDENT") {
    return "/dashboard";
  } else if (role === "SUPER_ADMIN") {
    return "/dashboard/staff/super_admin";
  } else {
    return `/dashboard/staff/${role.toLowerCase()}`;
  }
}
