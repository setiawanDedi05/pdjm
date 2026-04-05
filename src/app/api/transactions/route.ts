import { z } from 'zod';
import { processCheckout, getTransactions } from '@/services/checkoutService';
import { getAuthFromRequest } from '@/lib/auth';
import { apiResponse, apiError, handleApiError } from '@/lib/utils';
import { syncDB } from '@/models';

const checkoutSchema = z.object({
  customer_name: z.string().min(1, 'Nama customer diperlukan'),
  vehicle_plate: z.string().min(1, 'Nomor plat diperlukan'),
  payment_method: z.enum(['cash', 'qris', 'va']),
  status: z.enum(['paid', 'pending']).default('paid'),
  midtrans_order_id: z.string().nullable().optional(),
  // z.coerce.number() handles Sequelize DECIMAL columns, which pg serialises
  // as strings (e.g. "65000.00") rather than JS numbers.
  total_price: z.coerce.number().min(0),
  service_fee: z.coerce.number().min(0).optional().default(0),
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
});

export async function GET(request: Request) {
  try {
    await syncDB();
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);
    if (auth.role !== 'admin') {
      return apiError('Forbidden: hanya admin yang dapat mengakses daftar transaksi', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const status = searchParams.get('status') || undefined;

    const result = await getTransactions(page, limit, status);
    return apiResponse(result, 'Transaksi berhasil diambil');
  } catch (error) {
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
      return apiError(parsed.error.issues[0].message, 400);
    }
    const transaction = await processCheckout(parsed.data, auth.id);
    return apiResponse(transaction, 'Transaksi berhasil diproses', 201);
  } catch (error) {
    return handleApiError(error);
  }
}

