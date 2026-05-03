import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@/models';

// GET /api/reports/product-sale?period=day|month|year
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'day';

  let dateFormat: string;
  if (period === 'year') {
    dateFormat = 'YYYY';
  } else if (period === 'month') {
    dateFormat = 'YYYY-MM';
  } else {
    dateFormat = 'YYYY-MM-DD';
  }

  // Aggregate product sales by period (PostgreSQL)
  const results = await Transaction.sequelize!.query(
    `SELECT TO_CHAR(t."createdAt", '${dateFormat}') as label, SUM(td.qty)::int as sold
     FROM transactions t
     JOIN transaction_details td ON td.transaction_id = t.id
     WHERE t.status = 'paid' AND td.product_id IS NOT NULL
     GROUP BY label
     ORDER BY label ASC`,
    { type: 'SELECT' }
  );

  return NextResponse.json({ success: true, data: results });
}
