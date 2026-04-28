'use client';

import { forwardRef, useEffect, useState } from 'react';
import type { Transaction, TransactionDetail } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PrintReceiptProps {
  transaction: Transaction;
  products: {
    data: TransactionDetail[];
    total: number;
  }
  servicefees: {
      data: TransactionDetail[];
      total: number;
    };
  potongan: {
      data: TransactionDetail[];
      total: number;
    };
}

const PrintReceipt = forwardRef<HTMLDivElement, PrintReceiptProps>(
  ({ transaction, products, servicefees, potongan }, ref) => {
    const [isClient, setIsClient] = useState(false)
    const total = products.total + servicefees.total;
    const grandTotal = products.total + servicefees.total - potongan.total;

    const isHutang = transaction.payment_method?.toLowerCase() === 'hutang';
    
    useEffect(() => {
      setIsClient(true)
    }, [])

    return (
      <div
        ref={ref}
        className="print-receipt p-4 bg-white"
        style={{ 
          width: '210mm',      // Lebar Folio (21 cm)
          height: '110mm',     // Tinggi 1/3 Folio (11 cm)
          fontFamily: "'Courier New', Courier, monospace", 
          fontSize: '11px',    // Sedikit lebih kecil agar muat banyak item
          color: 'black',
          margin: '0 auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Atas: Header & Info Nota */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ width: '60%' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>PADA JAYA MOTOR</div>
            <div style={{ fontSize: '10px' }}>Kp. Pacet Beunying RT/RW. 01/07, Pacet, Cianjur</div>
            <div style={{ fontSize: '10px' }}>Telp: 0815-7527-1662</div>
          </div>
          <div style={{ width: '40%', textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', border: '1px solid black', padding: '2px', display: 'inline-block' }}>
              {isHutang ? 'NOTA HUTANG' : 'NOTA TRANSAKSI'}
            </div>
            <div style={{ marginTop: '5px' }}>No: {transaction.invoice_number}</div>
            <div>Tgl: {formatDate(transaction.createdAt)}</div>
          </div>
        </div>

        {/* Info Customer & Kendaraan */}
        <div style={{ display: 'flex', borderTop: '1px solid black', borderBottom: '1px solid black', padding: '5px 0', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>Cust: {transaction.customer_name}</div>
          <div style={{ flex: 1 }}>Unit: {transaction.vehicle_plate}</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Bayar: <span style={{ textTransform: 'uppercase' }}>{transaction.payment_method}</span></div>
        </div>

        {/* Tabel Barang/Jasa - Dengan Flex Grow agar footer tetap di bawah */}
        <div style={{ flexGrow: 1, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px dotted black' }}>
                <th style={{ textAlign: 'left' }}>Nama Barang / Jasa</th>
                <th style={{ textAlign: 'center', width: '40px' }}>Qty</th>
                <th style={{ textAlign: 'right', width: '90px' }}>Harga</th>
                <th style={{ textAlign: 'right', width: '90px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {products.data.map((detail) => (
                <tr key={detail.id}>
                  <td style={{ padding: '2px 0' }}>{detail.product?.name}</td>
                  <td style={{ textAlign: 'center' }}>{detail.qty}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(detail.price_at_time)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(detail.subtotal)}</td>
                </tr>
              ))}
              {servicefees.data.map((detail) => (
                <tr key={detail.id}>
                  <td style={{ padding: '2px 0' }}>Service {detail.product_name}</td>
                  <td style={{ textAlign: 'center' }}>{detail.qty}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(detail.price_at_time)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(detail.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bawah: Total & Tanda Tangan */}
        <div style={{ display: 'flex', borderTop: '1px solid black', paddingTop: '5px', marginTop: 'auto' }}>
          {/* Tanda Tangan */}
          <div style={{ flex: 2, display: 'flex', justifyContent: 'space-between', paddingRight: '20px' }}>
            <div style={{ textAlign: 'center', width: '100px' }}>
              <p style={{ marginBottom: '30px', fontSize: '10px' }}>Penerima</p>
              <p>( ________ )</p>
            </div>
            <div style={{ textAlign: 'center', width: '100px' }}>
              <p style={{ marginBottom: '30px', fontSize: '10px' }}>Hormat Kami</p>
              <p>( ________ )</p>
            </div>
          </div>

          {/* Rincian Harga */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal Product:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            {potongan.data.map((detail) => (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Potongan {detail.product_name}</span>
                  <span style={{fontWeight: 'bold'}}>{formatCurrency(detail.subtotal)}</span>
                </div>
              ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px double black', marginTop: '2px', paddingTop: '2px' }}>
              <span>TOTAL:</span>
              {/* Render placeholder atau Rp 0 saat di server, 
                  render total asli saat sudah di client */}
              {isClient ? formatCurrency(grandTotal) : 'Rp 0'}
            </div>
            {isHutang && (
              <div style={{ fontSize: '9px', textAlign: 'right', marginTop: '2px', fontWeight: 'bold' }}>
                Jatuh Tempo: {transaction.due_date ? formatDate(transaction.due_date) : '-'}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

PrintReceipt.displayName = 'PrintReceipt';
export default PrintReceipt;