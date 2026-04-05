import { z } from 'zod';
import { adjustStock, getStockLogs } from '@/services/stockService';
import { getAuthFromRequest } from '@/lib/auth';
import { apiResponse, apiError, handleApiError } from '@/lib/utils';
import { syncDB } from '@/models';

const adjustStockSchema = z.object({
  product_id: z.number().int().positive(),
  amount: z.number().int().min(1),
  type: z.enum(['in', 'out']),
  reason: z.enum(['sale', 'adjustment', 'purchase']),
});

export async function GET(request: Request) {
  try {
    await syncDB();
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get('product_id');
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const result = await getStockLogs(
      product_id ? Number(product_id) : undefined,
      page,
      limit
    );
    return apiResponse(result, 'Log stok berhasil diambil');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await syncDB();
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);
    if (!['admin'].includes(auth.role)) return apiError('Forbidden', 403);

    const body = await request.json();
    const parsed = adjustStockSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { product_id, amount, type, reason } = parsed.data;
    const product = await adjustStock(product_id, amount, type, reason);
    return apiResponse(product, `Stok berhasil ${type === 'in' ? 'ditambah' : 'dikurangi'}`, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

