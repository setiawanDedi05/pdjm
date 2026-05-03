import { Product, Transaction } from '@/models';
import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();

  console.log({id}, "iniid")
  try {
    // 1. Template Master (Hardcoded Months)
    // Menjamin response selalu punya 12 bulan meskipun DB kosong
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const monthlyStats = monthNames.map((month) => ({
      label: month,
      sale: 0,
    }));

    // 2. Database Execution
    // Menggunakan raw query PostgreSQL dengan Sequelize untuk performa agregasi maksimal
    const results = await Transaction.sequelize!.query<{ month_index: string; sold: number }>(
      `
      SELECT 
        TO_CHAR(t."createdAt", 'MM') as month_index, 
        SUM(td.qty)::int as sold
      FROM transactions t
      JOIN transaction_details td ON td.transaction_id = t.id
      WHERE t.status = 'paid' 
        AND td.product_id = :productId
        AND EXTRACT(YEAR FROM t."createdAt") = :year
      GROUP BY month_index
      ORDER BY month_index ASC
      `,
      {
        replacements: { productId: id, year },
        type: QueryTypes.SELECT,
      }
    );

    // 3. Data Transformation (The "Merger" Logic)
    // Menabrakkan hasil DB ke template 12 bulan kita
    results.forEach((row) => {
      const index = parseInt(row.month_index, 10) - 1; 
      if (monthlyStats[index]) {
        monthlyStats[index].sale = row.sold;
      }
    });

    // 4. Fetch Meta Data (Title)
    const product = await Product.findByPk(id, { attributes: ['name', 'serial_number'] });

    // 5. Senior-Standard Response
    return NextResponse.json({
      success: true,
      data: {
        content: monthlyStats,
        product: product
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('API_SALES_STATS_ERROR:', error);
    
    return NextResponse.json({
      success: false,
      message: "Internal Server Error",
      // Jangan kirim detail error stack ke client di production
    }, { status: 500 });
  }
}