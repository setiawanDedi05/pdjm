import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { StockLog } from '@/models';

// GET /api/reports/product-in?period=day|month|year
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

  // Aggregate product in by period (PostgreSQL)
  const results = await StockLog.sequelize!.query(
    `SELECT TO_CHAR("createdAt", '${dateFormat}') as label, SUM(amount)::int as "in"
     FROM stock_logs
     WHERE type = 'in'
     GROUP BY label
     ORDER BY label ASC`,
    { type: 'SELECT' }
  );

  return NextResponse.json({ success: true, data: results });
}
