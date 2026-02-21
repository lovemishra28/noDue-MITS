import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { approvalId, status, remarks, approvedBy } = body;

    // 1. Update the specific department's approval record
    const updatedApproval = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status, // "APPROVED" or "REJECTED"
        remarks,
        actionDate: new Date(),
      },
    });

    // 2. Fetch the associated application to check progress
    const application = await prisma.application.findUnique({
      where: { id: updatedApproval.applicationId },
      include: { approvals: true },
    });

    if (!application) throw new Error("Application not found");

    // 3. Logic for Stage Progression (Section 4.4)
    if (status === "APPROVED") {
      const nextStage = updatedApproval.stage + 1;
      const totalStages = application.approvals.length;

      if (nextStage <= 9) {
        // Update application to the next sequential stage
        await prisma.application.update({
          where: { id: application.id },
          data: { currentStage: nextStage },
        });
      } else {
        // If Stage 9 (Accounts Office) is approved, mark as Fully Approved
        await prisma.application.update({
          where: { id: application.id },
          data: { status: "FULLY_APPROVED" },
        });
      }
    } else if (status === "REJECTED") {
      // If any department rejects, mark the overall application as rejected
      await prisma.application.update({
        where: { id: application.id },
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json({ success: true, message: "Status updated" });

  } catch (error) {
    console.error("Approval Update Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 });
  }
}