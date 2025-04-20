import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  const { pathname } = request.nextUrl;

  // Allow requests to static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users trying to access protected routes
  if (!session && (pathname.startsWith('/dashboard') || !pathname.includes('/auth'))) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

 

  // Redirect authenticated users away from the auth page
  if (session && (pathname === '/auth' || !pathname.includes('/dashboard'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
