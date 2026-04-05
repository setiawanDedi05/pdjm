import { getAuthUser } from '@/lib/auth';
import { apiResponse, apiError } from '@/lib/utils';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError('Unauthorized', 401);
  return apiResponse({ user }, 'User ditemukan');
}

