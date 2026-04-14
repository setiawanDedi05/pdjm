import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { Transaction } from '@/models';

// GET /api/reports/summary?period=day|month|year
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'day';

  // Revenue
  let dateFormat: string;
  if (period === 'year') {
    dateFormat = 'YYYY';
  } else if (period === 'month') {
    dateFormat = 'YYYY-MM';
  } else {
    dateFormat = 'YYYY-MM-DD';
  }

  // Use sequelize to aggregate (PostgreSQL)
  const results = await Transaction.sequelize!.query(
    `SELECT TO_CHAR("createdAt", '${dateFormat}') as label, SUM(total_price)::float as revenue
     FROM transactions
     WHERE status = 'paid'
     GROUP BY label
     ORDER BY label ASC`,
    { type: 'SELECT' }
  );

  return NextResponse.json({ success: true, data: results });
}
