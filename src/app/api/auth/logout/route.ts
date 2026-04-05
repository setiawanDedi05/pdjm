import { cookies } from 'next/headers';
import { apiResponse } from '@/lib/utils';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  return apiResponse(null, 'Logout berhasil');
}

