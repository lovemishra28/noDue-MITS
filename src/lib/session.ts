import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  enrollmentNo?: string;
  department?: string;
}

/**
 * Read the session from Supabase Auth + Prisma in API routes.
 * Returns a JWTPayload-compatible object or null.
 */
export async function getServerSession(): Promise<JWTPayload | null> {
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
            // Can't set cookies in Server Components — safe to ignore
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!userData) return null;

  return {
    userId: userData.id,
    email: userData.email,
    role: userData.role,
    name: userData.name,
    enrollmentNo: userData.enrollmentNo ?? undefined,
    department: userData.department ?? undefined,
  };
}
