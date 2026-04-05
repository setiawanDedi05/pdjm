'use client';

import { forwardRef } from 'react';
import type { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PrintReceiptProps {
  transaction: Transaction;
}

const PrintReceipt = forwardRef<HTMLDivElement, PrintReceiptProps>(
  ({ transaction }, ref) => {
    const itemsTotal = transaction.details?.reduce((s, d) => s + Number(d.subtotal), 0) ?? Number(transaction.total_price);
    const serviceFee = Number(transaction.service_fee ?? 0);
    const total = itemsTotal + serviceFee;

    return (
      <div
        ref={ref}
        className="print-receipt p-2 bg-white"
        style={{ width: '54mm', fontFamily: "'Courier New', Courier, monospace", fontSize: '10px' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Pada Jaya Motor</div>
          <div>Jl. Contoh No. 123, Kota</div>
          <div>Telp: 0812-3456-7890</div>
          <div>{'='.repeat(32)}</div>
        </div>

        {/* Invoice info */}
        <div style={{ marginBottom: '4px' }}>
          <div>No: {transaction.invoice_number}</div>
          <div>Tgl: {formatDate(transaction.createdAt)}</div>
          <div>Customer: {transaction.customer_name}</div>
          <div>Plat: {transaction.vehicle_plate}</div>
          <div>{'-'.repeat(32)}</div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: '4px' }}>
          {transaction.details?.map((detail) => (
            <div key={detail.id} style={{ marginBottom: '2px' }}>
              <div style={{ fontWeight: 'bold' }}>{detail.product?.name ?? `Produk #${detail.product_id}`}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  {detail.qty} x {formatCurrency(detail.price_at_time)}
                </span>
                <span>{formatCurrency(detail.subtotal)}</span>
              </div>
            </div>
          ))}
          <div>{'='.repeat(32)}</div>
        </div>

        {/* Total */}
        <div style={{ marginBottom: '4px' }}>
          {serviceFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal Barang</span>
              <span>{formatCurrency(itemsTotal)}</span>
            </div>
          )}
          {serviceFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Biaya Jasa</span>
              <span>{formatCurrency(serviceFee)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px' }}>
            <span>TOTAL</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Metode</span>
            <span style={{ textTransform: 'uppercase' }}>{transaction.payment_method}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Status</span>
            <span style={{ textTransform: 'uppercase' }}>{transaction.status}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '6px' }}>
          <div>{'-'.repeat(32)}</div>
          <div>Terima kasih atas kunjungan Anda!</div>
          <div>Barang yang sudah dibeli</div>
          <div>tidak dapat dikembalikan.</div>
        </div>
      </div>
    );
  }
);

PrintReceipt.displayName = 'PrintReceipt';
export default PrintReceipt;

