import { sequelize, Product, StockLog } from '@/models';

export async function adjustStock(
  product_id: number,
  amount: number,
  type: 'in' | 'out',
  reason: 'sale' | 'adjustment' | 'purchase'
) {
  const product = await Product.findByPk(product_id);
  if (!product) throw new Error('Produk tidak ditemukan');

  if (type === 'out' && product.stock < amount) {
    throw new Error(`Stok tidak mencukupi. Tersedia: ${product.stock}`);
  }

  await sequelize.transaction(async (t) => {
    if (type === 'in') {
      await Product.increment('stock', { by: amount, where: { id: product_id }, transaction: t });
    } else {
      await Product.decrement('stock', { by: amount, where: { id: product_id }, transaction: t });
    }

    await StockLog.create(
      { product_id, type, amount, reason },
      { transaction: t }
    );
  });

  await product.reload();
  return product;
}

export async function getStockLogs(product_id?: number, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const where: Record<string, unknown> = {};
  if (product_id) where.product_id = product_id;

  const { count, rows } = await StockLog.findAndCountAll({
    where,
    include: [{ association: 'product', attributes: ['id', 'name', 'serial_number'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { logs: rows, total: count, page, limit };
}

