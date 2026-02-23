import { NextResponse } from "next/server";
import { getSessionWithPrisma } from "@/lib/supabase/server";

// GET /api/auth/me — Returns the current user from Supabase auth + Prisma
export async function GET() {
  const user = await getSessionWithPrisma();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      enrollmentNo: user.enrollmentNo,
      department: user.department,
    },
  });
}
