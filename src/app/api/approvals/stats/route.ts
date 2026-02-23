import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

/**
 * GET /api/approvals/stats
 * Returns approval statistics for the authenticated user
 * (only for staff/non-student roles)
 */
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (session.role === "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Students cannot access this endpoint" },
        { status: 403 }
      );
    }

    // Fetch all approvals processed by this user (approved or rejected)
    const completedApprovals = await prisma.approval.findMany({
      where: {
        approvedBy: session.userId,
      },
    });

    const approved = completedApprovals.filter((a) => a.status === "APPROVED").length;
    const rejected = completedApprovals.filter((a) => a.status === "REJECTED").length;

    return NextResponse.json({
      success: true,
      data: {
        totalApproved: approved,
        totalRejected: rejected,
        totalProcessed: approved + rejected,
      },
    });
  } catch (error) {
    console.error("Approval Stats Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch approval statistics" },
      { status: 500 }
    );
  }
}
