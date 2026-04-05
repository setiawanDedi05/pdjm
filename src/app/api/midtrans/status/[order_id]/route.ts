import { getAuthFromRequest } from '@/lib/auth';
import { apiResponse, apiError, handleApiError } from '@/lib/utils';
import type { TransactionStatus } from '@/types';

function mapMidtransStatus(transactionStatus: string): TransactionStatus {
  if (transactionStatus === 'settlement' || transactionStatus === 'capture') return 'paid';
  if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire' || transactionStatus === 'failure') return 'cancelled';
  return 'pending';
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ order_id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);

    const { order_id } = await params;
    if (!order_id) return apiError('order_id diperlukan', 400);

    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const baseUrl = isProduction
      ? `https://api.midtrans.com/v2/${encodeURIComponent(order_id)}/status`
      : `https://api.sandbox.midtrans.com/v2/${encodeURIComponent(order_id)}/status`;

    const authHeader = Buffer.from(`${serverKey}:`).toString('base64');

    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${authHeader}`,
        Accept: 'application/json',
      },
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new Error('Midtrans mengembalikan respons tidak valid (bukan JSON)');
    }

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.status_message || data.error_messages?.[0] || 'Midtrans error';
      throw new Error(errMsg);
    }

    const transactionStatus: string = data.transaction_status ?? 'unknown';
    const mappedStatus = mapMidtransStatus(transactionStatus);

    return apiResponse(
      { transaction_status: transactionStatus, mapped_status: mappedStatus },
      'Status Midtrans berhasil diambil'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

