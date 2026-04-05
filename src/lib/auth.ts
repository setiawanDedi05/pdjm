import { cookies } from 'next/headers';
import { verifyToken } from '@/services/authService';
import type { AuthPayload, UserRole } from '@/types';

export async function getAuthUser(): Promise<AuthPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(allowedRoles?: UserRole[]): Promise<AuthPayload> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (match) return match[1];
  }

  return null;
}

export function getAuthFromRequest(request: Request): AuthPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

