import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createToken, setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // --- Input validation ---
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    // 1. Look up user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.password) {
      // Generic message to prevent user enumeration
      // Also handles users who signed up with Google (no password) trying to use password login
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 2. Verify password against bcrypt hash
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 3. Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      enrollmentNo: user.enrollmentNo ?? undefined,
      department: user.department ?? undefined,
    });

    // 4. Set httpOnly cookie
    await setSessionCookie(token);

    // 5. Determine redirect path based on role
    let redirectPath = "/dashboard";
    if (user.role === "STUDENT") {
      redirectPath = "/dashboard";
    } else if (user.role === "SUPER_ADMIN") {
      redirectPath = "/dashboard/staff/super_admin";
    } else {
      redirectPath = `/dashboard/staff/${user.role.toLowerCase()}`;
    }

    // 6. Return user data (no sensitive fields)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        enrollmentNo: user.enrollmentNo,
        department: user.department,
      },
      redirectPath,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
}