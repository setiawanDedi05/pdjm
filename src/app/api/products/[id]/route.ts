import { z } from 'zod';
import { getProductById, updateProduct, deleteProduct } from '@/services/productService';
import { getAuthFromRequest } from '@/lib/auth';
import { apiResponse, apiError, handleApiError } from '@/lib/utils';

const updateProductSchema = z.object({
  serial_number: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  minimum_stock: z.number().int().min(0).optional(),
  price_buy: z.number().min(0).optional(),
  price_sell: z.number().min(0).optional(),
  buy_date: z.string().nullable().optional(),
  suplier: z.string().nullable().optional(),
  alias_supplier: z.string().nullable().optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);
    const { id } = await params;
    const product = await getProductById(Number(id));
    return apiResponse(product, 'Produk ditemukan');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);
    if (!['admin'].includes(auth.role)) return apiError('Forbidden', 403);

    const { id } = await params;
    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const product = await updateProduct(Number(id), parsed.data);
    return apiResponse(product, 'Produk berhasil diperbarui');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);
    if (!['admin'].includes(auth.role)) return apiError('Forbidden', 403);

    const { id } = await params;
    const result = await deleteProduct(Number(id));
    return apiResponse(result, 'Produk berhasil dihapus');
  } catch (error) {
    return handleApiError(error);
  }
}

