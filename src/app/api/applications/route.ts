import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // 1. Parse the incoming JSON from the student's form submission
    const body = await request.json();
    
    const { 
      studentId, fullName, fatherName, phoneNumber, address, 
      passOutYear, course, cgpa, isHostelResident, hostelName, 
      roomNumber, cautionMoneyRefund, receiptNumber, 
      feeReceipts, marksheet, bankDetails, collegeId 
    } = body;

    // 2. Generate a unique Application Number (e.g., #A82B9C1F)
    const applicationNo = `#A${Math.random().toString(16).substring(2, 8).toUpperCase()}`;

    // 3. Save everything to PostgreSQL in a single transaction
    const newApplication = await prisma.application.create({
      data: {
        applicationNo,
        studentId, // Links to the User table
        fullName,
        fatherName,
        phoneNumber,
        address,
        passOutYear: Number(passOutYear),
        course,
        cgpa: Number(cgpa),
        isHostelResident,
        hostelName,
        roomNumber,
        cautionMoneyRefund,
        receiptNumber,
        feeReceipts: feeReceipts || [],
        marksheet,
        bankDetails,
        collegeId,
        status: "SUBMITTED",
        currentStage: 1, // Starts at Stage 1 (Faculty)
        
        // 4. Generate the Approval Timeline dynamically
        approvals: {
          create: [
            { stage: 1, department: "Faculty" },
            { stage: 2, department: "Class Coordinator" },
            { stage: 3, department: "HOD" },
            // Conditional Logic: Only add Hostel Warden if the student lives in a hostel
            ...(isHostelResident ? [{ stage: 4, department: "Hostel Warden" }] : []),
            { stage: 5, department: "Library" },
            { stage: 6, department: "Workshop / Lab" },
            { stage: 7, department: "Training & Placement Cell" },
            { stage: 8, department: "General Office" },
            { stage: 9, department: "Accounts Office" },
          ]
        }
      }
    });

    // Return a success response to the frontend
    return NextResponse.json(
      { success: true, message: "Application Submitted", data: newApplication }, 
      { status: 201 }
    );

  } catch (error) {
    console.error("Application Submission Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit application" }, 
      { status: 500 }
    );
  }
}