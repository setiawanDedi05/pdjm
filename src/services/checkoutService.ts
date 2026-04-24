
import { sequelize, Transaction, TransactionDetail, Product, StockLog } from '@/models';
import type { CheckoutPayload, TransactionStatus } from '@/types';
import { Op } from 'sequelize';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');

function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const time = String(date.getTime()).slice(-6);
  return `INV/${year}${month}${day}/${time}`;
}

export async function processCheckout(payload: CheckoutPayload, userId: number) {
  const { customer_name, vehicle_plate, payment_method, status, midtrans_order_id, items, total_price, service_fees = [], due_date, toko_name, no_telp } = payload;

  // Validate items stock before starting transaction
  for (const item of items) {
    const product = await Product.findByPk(item.product_id);
    if (!product) {
      throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan`);
    }
    if (product.stock < item.qty) {
      throw new Error(`Stok ${product.name} tidak mencukupi. Stok tersedia: ${product.stock}`);
    }
  }

  // Use Sequelize transaction for atomicity
  const result = await sequelize.transaction(async (t) => {
    // 0. Re-validate stock inside the transaction with a pessimistic row lock
    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.product_id },
        lock: t.LOCK.UPDATE,   // SELECT ... FOR UPDATE — prevents concurrent modification
        transaction: t,
      });
      if (!product) throw new Error(`USER_ERROR: Produk dengan ID ${item.product_id} tidak ditemukan`);
      if (product.stock < item.qty)
        throw new Error(`USER_ERROR: Stok ${product.name} tidak mencukupi. Tersedia: ${product.stock}`);
    }

    const newOrderId = midtrans_order_id ?? "";
    // 1. Create transaction record
    const transaction = await Transaction.create(
      {
        invoice_number: payment_method === 'qris' ? newOrderId : generateInvoiceNumber(),
        total_price,
        payment_method,
        status,
        customer_name,
        vehicle_plate,
        user_id: userId,
        midtrans_order_id: midtrans_order_id ?? null,
        toko_name,
        due_date,
        no_telp,
      },
      { transaction: t }
    );

    // 2. Create transaction details, decrement stock, log stock
    for (const item of items) {
      // Create detail
      await TransactionDetail.create(
        {
          transaction_id: transaction.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_type: 'part',
          qty: item.qty,
          price_at_time: item.price_at_time,
          subtotal: item.subtotal,
        },
        { transaction: t }
      );

      // Decrement product stock
      await Product.decrement('stock', {
        by: item.qty,
        where: { id: item.product_id },
        transaction: t,
      });

      // Log stock movement
      await StockLog.create(
        {
          product_id: item.product_id,
          type: 'out',
          amount: item.qty,
          reason: 'sale',
        },
        { transaction: t }
      );
    }

    // 3. Create service fees
    for (const fee of service_fees) {
      await TransactionDetail.create(
        {
          transaction_id: transaction.id,
          product_name: fee.service_name,
          product_type: 'service',
          qty: 1, // Service fee is treated as a single item
          price_at_time: fee.service_price,
          subtotal: fee.service_price, // Assuming subtotal is the same as the service price for simplicity
        },
        { transaction: t }
      );
    }

    return transaction;
  });

  // Fetch complete transaction with details
  const fullTransaction = await Transaction.findByPk(result.id, {
    include: [
      {
        association: 'details',
        include: [{ association: 'product' }],
      },
    ],
  });

  return fullTransaction ? fullTransaction.get({ plain: true }) : null;
}

export async function getTransactions(page = 1, limit = 20, status?: string, metode?: string) {
  const offset = (page - 1) * limit;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (metode) where.payment_method = metode;

  const { count, rows } = await Transaction.findAndCountAll({
    where,
    include: [{ association: 'details', include: [{ association: 'product' }] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { transactions: rows.map((r) => r.get({ plain: true })), total: count, page, limit };
}

export async function updateTransactionStatus(id: number, status: TransactionStatus) {
  const trx = await Transaction.findByPk(id);
  if (!trx) throw new Error('Transaksi tidak ditemukan');

  await sequelize.transaction(async (t) => {
    // 1. Update the transaction status
    await trx.update({ status }, { transaction: t });

    // 2. On cancellation: restore stock and log each adjustment
    if (status === 'cancelled') {
      const details = await TransactionDetail.findAll({
        where: { transaction_id: id },
        transaction: t,
      });

      for (const detail of details) {
        // Restore product stock
        await Product.increment('stock', {
          by: detail.qty,
          where: { id: detail.product_id },
          transaction: t,
        });

        if(!detail.product_id) continue; // Skip if no associated product (e.g. service fee)
        // Log the stock restoration
        await StockLog.create(
          {
            product_id: detail.product_id,
            type: 'in',
            amount: detail.qty,
            reason: 'adjustment',
          },
          { transaction: t }
        );
      }
    }
  });

  return trx;
}

export async function getPendingHutangTransactions() {
  const now = new Date();
  const tenDaysLater = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  return Transaction.findAndCountAll({
    where: {
      payment_method: 'hutang',
      status: 'pending',
      due_date: {
        [Op.lte]: tenDaysLater,
        [Op.gte]: now,
      },
    },
    order: [['due_date', 'ASC']],
  });
}

