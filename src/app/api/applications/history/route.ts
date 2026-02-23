import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

/**
 * GET /api/applications/history
 * 
 * For STUDENTS: Returns all their applications with full approval details,
 *   including acceptance/rejection status and who processed them.
 * 
 * For STAFF/FACULTY: Returns all approvals they have processed (approved/rejected),
 *   including application details, applicant name, and decision info.
 *   Also returns summary counts.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (session.role === "STUDENT") {
      // ─── Student History: all applications with full approval chain ───
      const applications = await prisma.application.findMany({
        where: { studentId: session.userId },
        include: {
          approvals: {
            orderBy: { stage: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // For each approval that has an approvedBy, fetch the reviewer's name
      const reviewerIds = new Set<string>();
      for (const app of applications) {
        for (const a of app.approvals) {
          if (a.approvedBy) reviewerIds.add(a.approvedBy);
        }
      }

      const reviewers = reviewerIds.size > 0
        ? await prisma.user.findMany({
            where: { id: { in: Array.from(reviewerIds) } },
            select: { id: true, name: true, role: true },
          })
        : [];

      const reviewerMap = Object.fromEntries(
        reviewers.map((r) => [r.id, { name: r.name, role: r.role }])
      );

      const enrichedApplications = applications.map((app) => {
        const totalStages = app.approvals.length;
        const approvedStages = app.approvals.filter((a) => a.status === "APPROVED").length;
        const rejectedApproval = app.approvals.find((a) => a.status === "REJECTED");

        return {
          id: app.id,
          applicationNo: app.applicationNo,
          status: app.status,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          fullName: app.fullName,
          course: app.course,
          totalStages,
          approvedStages,
          completionPercentage: totalStages > 0 ? Math.round((approvedStages / totalStages) * 100) : 0,
          rejectedBy: rejectedApproval
            ? {
                department: rejectedApproval.department,
                stage: rejectedApproval.stage,
                remarks: rejectedApproval.remarks,
                actionDate: rejectedApproval.actionDate,
                reviewerName: rejectedApproval.approvedBy
                  ? reviewerMap[rejectedApproval.approvedBy]?.name || "Unknown"
                  : null,
              }
            : null,
          approvals: app.approvals.map((a) => ({
            id: a.id,
            stage: a.stage,
            department: a.department,
            status: a.status,
            remarks: a.remarks,
            actionDate: a.actionDate,
            reviewerName: a.approvedBy
              ? reviewerMap[a.approvedBy]?.name || "Unknown"
              : null,
            reviewerRole: a.approvedBy
              ? reviewerMap[a.approvedBy]?.role || null
              : null,
          })),
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          type: "student",
          totalApplications: applications.length,
          accepted: applications.filter((a) => a.status === "FULLY_APPROVED").length,
          rejected: applications.filter((a) => a.status === "REJECTED").length,
          inProgress: applications.filter((a) => a.status === "SUBMITTED" || a.status === "IN_PROGRESS").length,
          applications: enrichedApplications,
        },
      });
    } else {
      // ─── Staff/Reviewer History: all approvals processed by this user ───
      const processedApprovals = await prisma.approval.findMany({
        where: {
          approvedBy: session.userId,
          status: { in: ["APPROVED", "REJECTED"] },
        },
        include: {
          application: {
            select: {
              id: true,
              applicationNo: true,
              fullName: true,
              course: true,
              status: true,
              createdAt: true,
              studentId: true,
            },
          },
        },
        orderBy: { actionDate: "desc" },
      });

      const totalApproved = processedApprovals.filter((a) => a.status === "APPROVED").length;
      const totalRejected = processedApprovals.filter((a) => a.status === "REJECTED").length;

      const history = processedApprovals.map((a) => ({
        approvalId: a.id,
        stage: a.stage,
        department: a.department,
        status: a.status,
        remarks: a.remarks,
        actionDate: a.actionDate,
        application: {
          id: a.application.id,
          applicationNo: a.application.applicationNo,
          fullName: a.application.fullName,
          course: a.application.course,
          overallStatus: a.application.status,
          createdAt: a.application.createdAt,
        },
      }));

      return NextResponse.json({
        success: true,
        data: {
          type: "reviewer",
          totalProcessed: processedApprovals.length,
          totalApproved,
          totalRejected,
          history,
        },
      });
    }
  } catch (error) {
    console.error("History API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
