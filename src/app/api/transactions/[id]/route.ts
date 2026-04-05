import { z } from 'zod';
import { updateTransactionStatus } from '@/services/checkoutService';
import { Transaction } from '@/models';
import { getAuthFromRequest } from '@/lib/auth';
import { apiResponse, apiError, handleApiError } from '@/lib/utils';

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled']),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);

    const { id } = await params;
    const transaction = await Transaction.findByPk(Number(id), {
      include: [
        { association: 'details', include: [{ association: 'product' }] },
        { association: 'user', attributes: ['id', 'username', 'role'] },
      ],
    });
    if (!transaction) return apiError('Transaksi tidak ditemukan', 404);
    return apiResponse(transaction, 'Transaksi ditemukan');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);
    if (!['admin', 'kasir'].includes(auth.role)) return apiError('Forbidden', 403);

    const { id } = await params;
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const transaction = await updateTransactionStatus(Number(id), parsed.data.status);
    return apiResponse(transaction, 'Status transaksi diperbarui');
  } catch (error) {
    return handleApiError(error);
  }
}

