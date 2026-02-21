import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // 1. Look up user in PostgreSQL by institutional email (Section 1.2)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not registered in the system" },
        { status: 404 }
      );
    }

    // 2. Define redirection logic based on the 11-role hierarchy (Section 6.1)
    let redirectPath = "/dashboard/student"; // Default

    if (user.role === "STUDENT") {
      redirectPath = "/dashboard/student";
    } else if (user.role === "SUPER_ADMIN") {
      redirectPath = "/dashboard/admin";
    } else {
      // All other staff roles (Faculty, HOD, Accounts, etc.)
      redirectPath = `/dashboard/staff/${user.role.toLowerCase()}`;
    }

    // 3. Return the user data and the path they should be sent to
    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        role: user.role,
        email: user.email,
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