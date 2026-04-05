import { z } from 'zod';
import { getAuthFromRequest } from '@/lib/auth';
import { apiResponse, apiError, handleApiError } from '@/lib/utils';

const midtransTokenSchema = z.object({
  order_id: z.string().min(1),
  gross_amount: z.number().min(0),
  customer_name: z.string().min(1),
  vehicle_plate: z.string().min(1),
  payment_method: z.enum(["qris","va"])
});

export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError('Unauthorized', 401);

    const body = await request.json();
    const parsed = midtransTokenSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { order_id, gross_amount, customer_name, payment_method } = parsed.data;

    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const baseUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const authHeader = Buffer.from(`${serverKey}:`).toString('base64');

    const payload = {
      transaction_details: {
        order_id,
        gross_amount,
      },
      customer_details: {
        first_name: customer_name,
      },
      enabled_payments: 
        payment_method === "va" ? ["bca_va"] : ["qris", "gopay", "shopeepay", "ovo"]
      
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error_messages?.[0] || 'Midtrans error');
    }

    const data = await response.json();
    return apiResponse({ token: data.token, redirect_url: data.redirect_url }, 'Token Midtrans berhasil dibuat');
  } catch (error) {
    return handleApiError(error);
  }
}

