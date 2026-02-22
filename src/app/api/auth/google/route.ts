import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/auth/google
 * Initiates Google OAuth via Supabase.
 * Redirects the user to Google's consent screen.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    console.error("Google OAuth Error:", error);
    return NextResponse.redirect(
      new URL("/login?error=google_auth_failed", origin)
    );
  }

  return NextResponse.redirect(data.url);
}
