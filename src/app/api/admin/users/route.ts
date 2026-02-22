import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

// Valid roles that Super Admin can assign
const ASSIGNABLE_ROLES = [
  "STUDENT",
  "FACULTY",
  "CLASS_COORDINATOR",
  "HOD",
  "HOSTEL_WARDEN",
  "LIBRARY_ADMIN",
  "WORKSHOP_ADMIN",
  "TP_OFFICER",
  "GENERAL_OFFICE",
  "ACCOUNTS_OFFICER",
] as const;

/**
 * GET /api/admin/users?search=email@example.com
 * Search users by email (Super Admin only)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized — Super Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    if (!search || search.length < 2) {
      return NextResponse.json(
        { success: false, error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ],
        // Never return the Super Admin user itself
        role: { not: "SUPER_ADMIN" },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        enrollmentNo: true,
        createdAt: true,
      },
      take: 20,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Admin user search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search users" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Assign a role to a user (Super Admin only)
 * Body: { userId: string, role: string, department?: string }
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized — Super Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role, department } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    if (!role || !ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Allowed: ${ASSIGNABLE_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Make sure the target user exists and is not a Super Admin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Cannot modify Super Admin role" },
        { status: 403 }
      );
    }

    // Update the user's role (and optionally department)
    const updateData: { role: typeof role; department?: string } = { role };
    if (department !== undefined) {
      updateData.department = department;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        enrollmentNo: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Role updated to ${role} for ${updatedUser.email}`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Admin role assignment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
