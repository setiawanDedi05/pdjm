import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { AuthPayload } from '@/types';

/**
 * Decode a JWT payload WITHOUT signature verification.
 * Verification is intentionally skipped here — the Edge runtime cannot run
 * `jsonwebtoken`. Full crypto verification happens in the API layer
 * (`getAuthFromRequest`). We only read the role for routing decisions.
 */
function decodeTokenPayload(token: string): AuthPayload | null {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;
    // base64url → standard base64 → JSON
    const json = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as AuthPayload;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);

  const isAuthPage = pathname.startsWith('/login');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicApiRoute = pathname.startsWith('/api/auth');

  // Set the current pathname into a custom header
  requestHeaders.set('x-url', pathname);

  // Allow API auth routes (login / logout / me)
  if (isPublicApiRoute) return NextResponse.next();

  // Redirect unauthenticated users to login
  if (!token && !isAuthPage && !isApiRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from the login page
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/kasir', request.url));
  }

  // ── RBAC: only admin may access /reports ───────────────────────────
  if (token && pathname.startsWith('/reports')) {
    const payload = decodeTokenPayload(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/kasir', request.url));
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};

