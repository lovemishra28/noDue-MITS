import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        approvals: {
          orderBy: {
            stage: 'asc', // Ensures Faculty (1) comes before Accounts (9)
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    // Calculate completion percentage for the Dashboard (Section 2.4)
    const totalStages = application.approvals.length;
    const approvedStages = application.approvals.filter(
      (a) => a.status === "APPROVED"
    ).length;
    
    const completionPercentage = totalStages > 0 
      ? Math.round((approvedStages / totalStages) * 100) 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...application,
        completionPercentage,
      },
    });

  } catch (error) {
    console.error("Fetch Application Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch application details" },
      { status: 500 }
    );
  }
}