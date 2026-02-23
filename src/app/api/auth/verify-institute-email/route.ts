import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * POST /api/auth/verify-institute-email
 *
 * Called after Google OAuth when a new user needs to complete their profile.
 *
 * Role is determined automatically from the email domain:
 *   - @mitsgwl.ac.in  → STUDENT  (enrollmentNo + department required)
 *   - @mitsgwl.com    → FACULTY  (department required, no enrollmentNo)
 *   For external (non-institute) Google emails, the user must provide
 *   their institute email so we can determine the role.
 *
 * Body: { enrollmentNo?: string, department: string, instituteEmail?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { enrollmentNo, department, instituteEmail } = body;
    
    console.log("📝 Verify institute email request:", { enrollmentNo: enrollmentNo ? "***" : undefined, department, instituteEmail: instituteEmail ? "***" : undefined });

    // --- Validate department (required for both roles) ---
    if (!department || typeof department !== "string" || !department.trim()) {
      console.warn("⚠️  Department validation failed");
      return NextResponse.json(
        { success: false, error: "Department is required" },
        { status: 400 }
      );
    }

    // --- Read Google data from the pending cookie ---
    const cookieStore = await cookies();
    const pendingCookie = cookieStore.get("pending_google_auth")?.value;

    if (!pendingCookie) {
      console.warn("⚠️  No pending_google_auth cookie found");
      return NextResponse.json(
        {
          success: false,
          error: "Session expired. Please sign in with Google again.",
        },
        { status: 400 }
      );
    }

    let googleData: {
      supabaseUid: string;
      googleEmail: string;
      googleName: string;
      avatarUrl: string | null;
    };

    try {
      googleData = JSON.parse(pendingCookie);
      console.log("✅ Google data parsed from cookie:", { email: googleData.googleEmail, uid: googleData.supabaseUid });
    } catch {
      console.error("❌ Failed to parse pending_google_auth cookie");
      return NextResponse.json(
        { success: false, error: "Invalid session data. Please try again." },
        { status: 400 }
      );
    }

    // --- Determine role from email domain ---
    const emailLower = googleData.googleEmail.toLowerCase().trim();
    const domain = emailLower.split("@")[1];

    let role: UserRole;
    let finalEmail = emailLower;

    console.log("🔍 Determining role from email domain:", domain);

    if (domain === "mitsgwl.ac.in") {
      role = "STUDENT" as UserRole;
    } else if (domain === "mitsgwl.com") {
      role = "FACULTY" as UserRole;
    } else {
      // External email — user must provide their institute email
      console.log("📧 External email detected, requiring institute email");
      if (!instituteEmail || typeof instituteEmail !== "string" || !instituteEmail.trim()) {
        console.warn("⚠️  Institute email required but not provided");
        return NextResponse.json(
          {
            success: false,
            error: "Institute email is required. Please provide your @mitsgwl.ac.in or @mitsgwl.com email.",
          },
          { status: 400 }
        );
      }

      const instEmailLower = instituteEmail.toLowerCase().trim();
      const instDomain = instEmailLower.split("@")[1];
      console.log("📧 Institute email domain:", instDomain);

      if (instDomain === "mitsgwl.ac.in") {
        role = "STUDENT" as UserRole;
      } else if (instDomain === "mitsgwl.com") {
        role = "FACULTY" as UserRole;
      } else {
        console.warn("⚠️  Invalid institute email domain:", instDomain);
        return NextResponse.json(
          {
            success: false,
            error: "Invalid institute email. Only @mitsgwl.ac.in (student) and @mitsgwl.com (faculty) emails are accepted.",
          },
          { status: 400 }
        );
      }

      // Check if the institute email is already registered to another user
      const existingInstEmail = await prisma.user.findUnique({
        where: { email: instEmailLower },
      });
      if (existingInstEmail && existingInstEmail.id !== googleData.supabaseUid) {
        console.warn("⚠️  Institute email already registered:", instEmailLower);
        return NextResponse.json(
          {
            success: false,
            error: "This institute email is already registered to another account.",
          },
          { status: 409 }
        );
      }

      // Use institute email as the primary email for the user account
      finalEmail = instEmailLower;
    }

    console.log("✅ Role determined:", role, "Final email:", finalEmail);

    // --- Validate enrollmentNo for students ---
    if (role === "STUDENT") {
      console.log("🎓 Validating enrollment for student");
      if (!enrollmentNo || typeof enrollmentNo !== "string" || !enrollmentNo.trim()) {
        console.warn("⚠️  Enrollment number required but not provided");
        return NextResponse.json(
          { success: false, error: "Enrollment number is required for students" },
          { status: 400 }
        );
      }

      // Check if enrollment number is already taken
      const existingEnrollment = await prisma.user.findUnique({
        where: { enrollmentNo: enrollmentNo.toUpperCase() },
      });

      if (existingEnrollment && existingEnrollment.id !== googleData.supabaseUid) {
        console.warn("⚠️  Enrollment number already taken:", enrollmentNo.toUpperCase());
        return NextResponse.json(
          {
            success: false,
            error: "This enrollment number is already registered. Please contact support.",
          },
          { status: 409 }
        );
      }
    }

    // --- Check if email is already taken ---
    console.log("🔍 Checking if email exists:", finalEmail);
    const existingUser = await prisma.user.findUnique({
      where: { email: finalEmail },
    });

    if (existingUser) {
      console.log("👤 Existing user found with email:", finalEmail);
      // If the account exists but has a different Supabase UID, reject
      if (existingUser.id !== googleData.supabaseUid) {
        console.warn("⚠️  Email conflict: existing UID", existingUser.id, "!= new UID", googleData.supabaseUid);
        return NextResponse.json(
          {
            success: false,
            error: "This email is already registered to another account. Please use a different email or log in to your existing account.",
          },
          { status: 409 }
        );
      }

      // Same Supabase UID — just update and sign in
      console.log("✅ Same user, updating existing record");
      const updateData: Record<string, unknown> = {
        avatarUrl: googleData.avatarUrl || existingUser.avatarUrl,
        department,
      };
      if (role === "STUDENT" && enrollmentNo) {
        updateData.enrollmentNo = enrollmentNo.toUpperCase();
      }

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData as Parameters<typeof prisma.user.update>[0]["data"],
      });

      // Clean up the pending cookie
      cookieStore.delete("pending_google_auth");

      return signInAndRespond(updatedUser);
    }

    // --- Create new user ---
    console.log("📝 Creating new user:", { email: finalEmail, role, supabaseUid: googleData.supabaseUid });
    const newUser = await prisma.user.create({
      data: {
        id: googleData.supabaseUid,
        email: finalEmail,
        name: googleData.googleName,
        avatarUrl: googleData.avatarUrl,
        department,
        role,
        ...(role === "STUDENT" && enrollmentNo && { enrollmentNo: enrollmentNo.toUpperCase() }),
      },
    });
    console.log("✅ New user created successfully");

    // Clean up the pending cookie
    cookieStore.delete("pending_google_auth");

    return signInAndRespond(newUser);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";
    console.error("❌ Verify institute email error:", errorMessage);
    console.error("Stack trace:", errorStack);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again.", details: errorMessage },
      { status: 500 }
    );
  }
}

// ─── Helper ───────────────────────────────────────────────────
function signInAndRespond(user: {
  id: string;
  email: string;
  role: string;
  name: string;
  enrollmentNo: string | null;
  department: string | null;
}) {
  console.log("🔐 signInAndRespond called for user:", user.email, "role:", user.role);
  
  let redirectPath = "/dashboard";
  if (user.role === "STUDENT") {
    redirectPath = "/dashboard";
  } else if (user.role === "SUPER_ADMIN") {
    redirectPath = "/dashboard/staff/super_admin";
  } else {
    redirectPath = `/dashboard/staff/${user.role.toLowerCase()}`;
  }

  console.log("✅ Response prepared. Redirect path:", redirectPath);

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      enrollmentNo: user.enrollmentNo,
      department: user.department,
    },
    redirectPath,
  });
}
