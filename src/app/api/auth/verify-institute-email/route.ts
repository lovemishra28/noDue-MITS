import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createToken, setSessionCookie } from "@/lib/session";

const INSTITUTE_DOMAIN = "mitsgwl.in";

/**
 * POST /api/auth/verify-institute-email
 *
 * Called when a non-institute Google user submits their institute email.
 * Validates the email domain, creates the user, and signs them in.
 *
 * Body: { instituteEmail: string }
 */
export async function POST(request: Request) {
  try {
    const { instituteEmail } = await request.json();

    // --- Validate institute email ---
    if (!instituteEmail || typeof instituteEmail !== "string") {
      return NextResponse.json(
        { success: false, error: "Institute email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = instituteEmail.toLowerCase().trim();
    const domain = normalizedEmail.split("@")[1];

    if (domain !== INSTITUTE_DOMAIN) {
      return NextResponse.json(
        {
          success: false,
          error: `Only @${INSTITUTE_DOMAIN} email addresses are accepted`,
        },
        { status: 400 }
      );
    }

    // --- Read Google data from the pending cookie ---
    const cookieStore = await cookies();
    const pendingCookie = cookieStore.get("pending_google_auth")?.value;

    if (!pendingCookie) {
      return NextResponse.json(
        {
          success: false,
          error: "Session expired. Please sign in with Google again.",
        },
        { status: 400 }
      );
    }

    let googleData: {
      googleId: string;
      googleEmail: string;
      googleName: string;
      avatarUrl: string | null;
    };

    try {
      googleData = JSON.parse(pendingCookie);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid session data. Please try again." },
        { status: 400 }
      );
    }

    // --- Check if institute email is already taken ---
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // If the account exists but has no googleId, link it
      if (!existingUser.googleId) {
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            googleId: googleData.googleId,
            avatarUrl: googleData.avatarUrl || existingUser.avatarUrl,
          },
        });

        // Clean up the pending cookie
        cookieStore.delete("pending_google_auth");

        return await signInAndRespond(updatedUser);
      }

      // If it's already linked to a different Google account
      if (existingUser.googleId !== googleData.googleId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This institute email is already linked to another Google account.",
          },
          { status: 409 }
        );
      }

      // Same Google account — just sign in
      cookieStore.delete("pending_google_auth");
      return await signInAndRespond(existingUser);
    }

    // --- Create new user with institute email ---
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: googleData.googleName,
        googleId: googleData.googleId,
        avatarUrl: googleData.avatarUrl,
        role: "STUDENT",
      },
    });

    // Clean up the pending cookie
    cookieStore.delete("pending_google_auth");

    return await signInAndRespond(newUser);
  } catch (error) {
    console.error("Verify institute email error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// ─── Helper ───────────────────────────────────────────────────
async function signInAndRespond(user: {
  id: string;
  email: string;
  role: string;
  name: string;
  enrollmentNo: string | null;
  department: string | null;
}) {
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

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    redirectPath,
  });
}
