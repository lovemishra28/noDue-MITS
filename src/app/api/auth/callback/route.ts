import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createToken, setSessionCookie } from "@/lib/session";

const INSTITUTE_DOMAIN = "mitsgwl.ac.in";

/**
 * GET /api/auth/callback
 * Handles the OAuth callback from Supabase/Google.
 *
 * Flow:
 * 1. Exchange the code for a Supabase session
 * 2. Extract Google profile (email, name, avatar, sub)
 * 3. Check if user already exists by googleId → sign in
 * 4. If not, check email domain:
 *    - @mitsgwl.ac.in → auto-create user and sign in
 *    - Other domain → redirect to /verify-institute-email with Google data in a short-lived cookie
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=no_code", origin)
    );
  }

  const supabase = await createSupabaseServerClient();

  // Exchange the authorization code for a session
  const { data: sessionData, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData.user) {
    console.error("Callback session error:", sessionError);
    return NextResponse.redirect(
      new URL("/login?error=callback_failed", origin)
    );
  }

  const googleUser = sessionData.user;
  const googleEmail = googleUser.email!;
  const googleId = googleUser.id; // Supabase user id (linked to Google sub)
  const googleName =
    googleUser.user_metadata?.full_name ||
    googleUser.user_metadata?.name ||
    googleEmail.split("@")[0];
  const avatarUrl =
    googleUser.user_metadata?.avatar_url ||
    googleUser.user_metadata?.picture ||
    null;

  // -----------------------------------------------------------
  // 1. Check if user already exists in our DB by googleId
  // -----------------------------------------------------------
  let existingUser = await prisma.user.findUnique({
    where: { googleId },
  });

  if (existingUser) {
    // User exists → create session and redirect
    return await signInAndRedirect(existingUser, origin);
  }

  // Also check by email (in case they were created via password before)
  existingUser = await prisma.user.findUnique({
    where: { email: googleEmail.toLowerCase().trim() },
  });

  if (existingUser) {
    // Link the Google ID to the existing account
    existingUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        googleId,
        avatarUrl: avatarUrl || existingUser.avatarUrl,
      },
    });
    return await signInAndRedirect(existingUser, origin);
  }

  // -----------------------------------------------------------
  // 2. New user — check email domain
  // -----------------------------------------------------------
  const emailDomain = googleEmail.split("@")[1]?.toLowerCase();

  if (emailDomain === INSTITUTE_DOMAIN) {
    // Institute domain → auto-create and sign in
    const newUser = await prisma.user.create({
      data: {
        email: googleEmail.toLowerCase().trim(),
        name: googleName,
        googleId,
        avatarUrl,
        role: "STUDENT", // default role for new Google sign-ups
      },
    });
    return await signInAndRedirect(newUser, origin);
  }

  // -----------------------------------------------------------
  // 3. Non-institute domain → redirect to verify page
  //    Store Google data in a short-lived httpOnly cookie
  // -----------------------------------------------------------
  const googleData = JSON.stringify({
    googleId,
    googleEmail,
    googleName,
    avatarUrl,
  });

  const response = NextResponse.redirect(
    new URL("/verify-institute-email", origin)
  );

  response.cookies.set("pending_google_auth", googleData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes — enough time to fill the form
  });

  return response;
}

// ─── Helper ───────────────────────────────────────────────────
async function signInAndRedirect(
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    enrollmentNo: string | null;
    department: string | null;
  },
  origin: string
) {
  const token = await createToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    enrollmentNo: user.enrollmentNo ?? undefined,
    department: user.department ?? undefined,
  });

  await setSessionCookie(token);

  let redirectPath = "/dashboard";
  if (user.role === "STUDENT") {
    redirectPath = "/dashboard";
  } else if (user.role === "SUPER_ADMIN") {
    redirectPath = "/dashboard/staff/super_admin";
  } else {
    redirectPath = `/dashboard/staff/${user.role.toLowerCase()}`;
  }

  return NextResponse.redirect(new URL(redirectPath, origin));
}
