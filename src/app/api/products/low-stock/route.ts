import { getAuthFromRequest } from "@/lib/auth";
import { apiError, apiResponse, handleApiError } from "@/lib/utils";
import { syncDB } from "@/models";
import { getLowStockProducts } from "@/services/productService";

export async function GET(request: Request) {
  try {
    await syncDB();
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);

    const response = await getLowStockProducts();
    return apiResponse(response, 'Produk dengan stok rendah berhasil diambil');
  } catch (error) {
    return handleApiError(error);
  }
}