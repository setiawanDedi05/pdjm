import { z } from 'zod';
import { loginUser } from '@/services/authService';
import { syncDB } from '@/models';
import { apiResponse, apiError, handleApiError } from '@/lib/utils';
import { cookies } from 'next/headers';

const loginSchema = z.object({
  username: z.string().min(1, 'Username diperlukan'),
  password: z.string().min(1, 'Password diperlukan'),
});

export async function POST(request: Request) {
  try {
    await syncDB();
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { username, password } = parsed.data;
    const { token, user } = await loginUser(username, password);

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return apiResponse({ user }, 'Login berhasil');
  } catch (error) {
    return handleApiError(error);
  }
}

