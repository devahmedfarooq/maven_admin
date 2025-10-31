import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const cookieStore = await cookies();
  const session =  cookieStore.get('session')?.value;

  const { pathname } = request.nextUrl;
  
  // Debug logging (remove in production)
  console.log('Middleware - Path:', pathname, 'Session exists:', !!session);
  console.log('Middleware - Full URL:', request.url);
  console.log('Middleware - All cookies:', cookieStore.getAll().map(c => c.name));
  if (session) {
    console.log('Middleware - Session found, length:', session.length);
  }

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
  if (!session && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Redirect from root to auth if not authenticated, to dashboard if authenticated
  if (pathname === '/') {
    if (!session) {
      return NextResponse.redirect(new URL('/auth', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect authenticated users away from the auth page
  if (session && pathname === '/auth') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
