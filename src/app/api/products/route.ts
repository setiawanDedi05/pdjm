import { z } from 'zod';
import { getAllProducts, createProduct } from '@/services/productService';
import { getAuthFromRequest } from '@/lib/auth';
import { apiResponse, apiError, handleApiError } from '@/lib/utils';
import { syncDB } from '@/models';

const createProductSchema = z.object({
  serial_number: z.string().min(1, 'Serial number diperlukan'),
  name: z.string().min(1, 'Nama produk diperlukan'),
  description: z.string().nullable().optional(),
  stock: z.number().int().min(0, 'Stok tidak boleh negatif'),
  price_buy: z.number().min(0, 'Harga beli tidak valid'),
  price_sell: z.number().min(0, 'Harga jual tidak valid'),
  buy_date: z.string().nullable().optional(),
  suplier: z.string().nullable().optional(),
  alias_supplier: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    await syncDB();
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    const products = await getAllProducts(search);
    return apiResponse(products, 'Produk berhasil diambil');
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
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const product = await createProduct(parsed.data);
    return apiResponse(product, 'Produk berhasil dibuat', 201);
  } catch (error) {
    return handleApiError(error);
  }
}

