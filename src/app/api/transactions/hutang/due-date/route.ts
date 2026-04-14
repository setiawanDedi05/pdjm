import { getAuthFromRequest } from "@/lib/auth";
import { apiError, apiResponse, handleApiError } from "@/lib/utils";
import { syncDB } from "@/models";
import { getPendingHutangTransactions } from "@/services/checkoutService";

export async function GET(request: Request) {
  try {
    await syncDB();
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);

    const response = await getPendingHutangTransactions();
    return apiResponse(response, 'Transaksi hutang berhasil diambil');
  } catch (error) {
    return handleApiError(error);
  }
}