import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // --- Input validation ---
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    // 1. Sign in via Supabase Auth
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Can't set cookies in some contexts — safe to ignore
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 2. Look up user in Prisma by Supabase UID
    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found. Please contact admin." },
        { status: 401 }
      );
    }

    // 3. Determine redirect path based on role
    let redirectPath = "/dashboard";
    if (user.role === "STUDENT") {
      redirectPath = "/dashboard";
    } else if (user.role === "SUPER_ADMIN") {
      redirectPath = "/dashboard/staff/super_admin";
    } else {
      redirectPath = `/dashboard/staff/${user.role.toLowerCase()}`;
    }

    // 4. Return user data (no sensitive fields)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        enrollmentNo: user.enrollmentNo,
        department: user.department,
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