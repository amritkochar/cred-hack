import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs on every request
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // If the request is for the auth page, allow it
  if (path.startsWith('/auth')) {
    return NextResponse.next();
  }
  
  // Check if the user is authenticated by looking for the access token cookie
  const accessToken = request.cookies.get('access_token')?.value;
  
  // If there's no access token and the request is not for the auth page, redirect to auth
  if (!accessToken && !path.startsWith('/api')) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // Continue with the request
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
