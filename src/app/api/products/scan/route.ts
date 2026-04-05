import { getProductBySerial } from '@/services/productService';
import { getAuthFromRequest } from '@/lib/auth';
import { apiResponse, apiError, handleApiError } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const serial = searchParams.get('serial');
    if (!serial) return apiError('Serial number diperlukan', 400);

    const product = await getProductBySerial(serial);
    return apiResponse(product, 'Produk ditemukan');
  } catch (error) {
    return handleApiError(error);
  }
}

