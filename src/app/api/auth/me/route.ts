import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";

// GET /api/auth/me — Returns the current user from the JWT cookie
export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      enrollmentNo: session.enrollmentNo,
      department: session.department,
    },
  });
}
