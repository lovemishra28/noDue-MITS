import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define which roles can access which paths
const ROLE_ROUTES = {
  STUDENT: '/dashboard/student',
  FACULTY: '/dashboard/faculty',
  HOD: '/dashboard/hod',
  ACCOUNTS_OFFICER: '/dashboard/accounts',
  // Add other roles as needed...
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip middleware for API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // 2. Mock Session Check (Replace with your Auth session logic later)
  // In a real app, you'd get the user's email/role from a cookie or JWT
  const userRole = "STUDENT"; // This will be dynamic after Auth setup

  // 3. Prevent Students from accessing Staff areas (Section 5.1)
  if (pathname.startsWith('/dashboard/staff') && userRole === 'STUDENT') {
    return NextResponse.redirect(new URL('/dashboard/student', request.url));
  }

  // 4. Prevent Staff from accessing Student forms
  if (pathname.startsWith('/apply') && userRole !== 'STUDENT') {
    return NextResponse.redirect(new URL('/dashboard/faculty', request.url));
  }

  return NextResponse.next();
}

// Only run middleware on dashboard and application routes
export const config = {
  matcher: ['/dashboard/:path*', '/apply/:path*'],
};