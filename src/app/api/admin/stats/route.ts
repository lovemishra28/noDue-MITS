import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

/**
 * GET /api/admin/stats
 * Returns overview statistics for the Super Admin panel
 */
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized — Super Admin access required" },
        { status: 403 }
      );
    }

    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      roleDistribution,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: { not: "STUDENT", notIn: ["SUPER_ADMIN"] } } }),
      prisma.application.count(),
      prisma.application.count({ where: { status: "IN_PROGRESS" } }),
      prisma.application.count({ where: { status: "FULLY_APPROVED" } }),
      prisma.application.count({ where: { status: "REJECTED" } }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
        where: { role: { not: "SUPER_ADMIN" } },
        orderBy: { _count: { role: "desc" } },
      }),
    ]);

    // Get recent users (last 10 registered)
    const recentUsers = await prisma.user.findMany({
      where: { role: { not: "SUPER_ADMIN" } },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        roleDistribution: roleDistribution.map((r) => ({
          role: r.role,
          count: r._count.role,
        })),
        recentUsers,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
