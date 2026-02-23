import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Creates a Supabase client for use in Server Components, API Routes, and Server Actions.
 * It reads/writes Supabase auth cookies so the OAuth flow works correctly.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
            // setAll is called from Server Components where cookies can't be set.
            // This can safely be ignored if middleware refreshes the session.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client using the service role key.
 * This bypasses RLS policies and should only be used in secure server-side contexts.
 */
export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Gets the current Supabase-authenticated user's session
 * and fetches their application-specific data from Prisma
 */
export async function getSessionWithPrisma() {
  const supabase = await createSupabaseServerClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch user's application data from Prisma
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!userData) {
    return null;
  }

  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    enrollmentNo: userData.enrollmentNo,
    department: userData.department,
  };
}
