import { z } from 'zod';
import { updateTransaction, updateTransactionStatus } from '@/services/checkoutService';
import { Transaction } from '@/models';
import { getAuthFromRequest } from '@/lib/auth';
import { apiResponse, apiError, handleApiError } from '@/lib/utils';

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled', 'inprogress', 'draft'])
});

const updateTransactionSchema = z.object({
  customer_name: z.string().optional(),
  vehicle_plate: z.string().optional(),
  payment_method: z.enum(['cash', 'qris', 'va', 'hutang', 'transfer']),
  status: z.enum(['paid', 'pending', 'draft', 'inprogress']).default('draft'),
  midtrans_order_id: z.string().nullable().optional(),
  total_price: z.coerce.number().min(0),
  service_fees: z.array(
    z.object({
      service_name: z.string().min(2).max(100),  // STRING — always a JS string
      service_price: z.coerce.number().min(0),          // DECIMAL — arrives as string
    })
  ).optional(),
  toko_name: z.string().optional(),
  no_telp: z.string().optional(),
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),  // INTEGER — always a JS number
        qty: z.number().int().min(1),             // INTEGER — always a JS number
        price_at_time: z.coerce.number().min(0),  // DECIMAL — arrives as string
        subtotal: z.coerce.number().min(0),       // derived from DECIMAL — coerce defensively
      })
    )
    .min(1, 'Keranjang tidak boleh kosong'),
  due_date: z.string().optional().refine((date) => {
    if (!date) return true;
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }, 'Format tanggal tidak valid'), 
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

//put for edit
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);
    if (!['admin', 'kasir'].includes(auth.role)) return apiError('Forbidden', 403);

    const { id } = await params;
    const body = await request.json();
    const parsed = updateTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const transaction = await updateTransaction(Number(id), parsed.data);
    return apiResponse(transaction, 'Transaksi diperbarui');
  } catch (error) {
    return handleApiError(error);
  }
}