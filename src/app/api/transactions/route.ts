import { z } from 'zod';
import { processCheckout, getTransactions, updateTransactionStatus } from '@/services/checkoutService';
import { getAuthFromRequest } from '@/lib/auth';
import { apiResponse, apiError, handleApiError } from '@/lib/utils';
import { syncDB } from '@/models';

const checkoutSchema = z.object({
  customer_name: z.string().optional(),
  vehicle_plate: z.string().optional(),
  payment_method: z.enum(['cash', 'qris', 'va', 'hutang', 'transfer']),
  status: z.enum(['paid', 'pending', 'draft', 'inprogress']).default('pending'),
  midtrans_order_id: z.string().nullable().optional(),
  total_price: z.coerce.number().min(0),
  service_fees: z.array(
    z.object({
      service_name: z.string().min(2).max(100),  // STRING — always a JS string
      service_price: z.coerce.number().min(0),          // DECIMAL — arrives as string
    })
  ).optional(),
  discount: z.array(
    z.object({
      discount_name: z.string().min(2).max(100),  // STRING — always a JS string
      discount_price: z.coerce.number().min(0),          // DECIMAL — arrives as string
    })
  ),
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
export async function GET(request: Request) {
  try {
    await syncDB();
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);
    if (!['admin', 'kasir'].includes(auth.role)) return apiError('Forbidden', 403);

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const status = searchParams.get('status') || undefined;
    const metode = searchParams.get('metode') || undefined;

    const result = await getTransactions(page, limit, status, metode);
    return apiResponse(result, 'Transaksi berhasil diambil');
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await syncDB();
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);
    if (!['admin', 'kasir'].includes(auth.role)) return apiError('Forbidden', 403);

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      console.error('Validation error:', parsed.error);
      return apiError(parsed.error.issues[0].message, 400);
    }
    const transaction = await processCheckout(parsed.data, auth.id);
    return apiResponse(transaction, 'Transaksi berhasil diproses', 201);
  } catch (error) {
    return handleApiError(error);
  }
}