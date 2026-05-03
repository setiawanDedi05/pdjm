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
    const [isClient, setIsClient] = useState(false);
    const total = products.total + servicefees.total;
    const grandTotal = total - potongan.total;

    const isHutang = transaction.payment_method?.toLowerCase() === 'hutang';
    const username = transaction.user?.username;
    const name = transaction.user?.name;

    useEffect(() => {
      setIsClient(true);
    }, []);

    // Watermark SVG Pattern
    // Kita buat diagonal (rotate -45) dengan repetisi yang rapi
    const watermarkSvg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <text 
          x="50%" 
          y="50%" 
          font-family="Arial, sans-serif" 
          fill="rgba(200, 200, 200, 0.2)" 
          text-anchor="middle" 
          transform="rotate(-35, 100, 100)"
          style="user-select: none;"
        >
          <tspan x="100" dy="-1.2em" font-size="20" font-weight="bold">Pd. Pada Jaya Motor</tspan>
          <tspan x="100" dy="1.5em" font-size="16">${name}(${username})</tspan>
        </text>
      </svg>
    `.replace(/"/g, "'").replace(/>\s+</g, '><');

    const watermarkDataUrl = `url("data:image/svg+xml,${encodeURIComponent(watermarkSvg)}")`;

    return (
      <div
        ref={ref}
        className="print-receipt p-4 bg-white relative overflow-hidden"
        style={{ 
          width: '210mm',
          height: '110mm',
          fontFamily: "'Courier New', Courier, monospace", 
          fontSize: '11px',
          color: 'black',
          margin: '0 auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative', // Diperlukan untuk layering
        }}
      >
        {/* Layer Watermark */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: watermarkDataUrl,
            backgroundRepeat: 'repeat',
            pointerEvents: 'none', // Supaya tidak mengganggu interaksi mouse/klik
            zIndex: 0
          }}
        />

        {/* Content Container - Pastikan di atas watermark */}
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header */}
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

          {/* Info Customer */}
          <div style={{ display: 'flex', borderTop: '1px solid black', borderBottom: '1px solid black', padding: '5px 0', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>Cust: {transaction.customer_name}</div>
            {transaction.vehicle_plate && <div style={{ flex: 1 }}>Unit: {transaction.vehicle_plate}</div>}
            {transaction.toko_name && <div style={{ flex: 1 }}>Toko: {transaction.toko_name}</div>}
            {transaction.no_telp && <div style={{ flex: 1 }}>No Telp: {transaction.no_telp}</div>}
            <div style={{ flex: 1, textAlign: 'right' }}>Bayar: <span style={{ textTransform: 'uppercase' }}>{transaction.payment_method}</span></div>
          </div>

          {/* Tabel Items */}
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

          {/* Footer */}
          <div style={{ display: 'flex', borderTop: '1px solid black', paddingTop: '5px', marginTop: 'auto' }}>
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

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {potongan.data.map((detail) => (
                <div key={detail.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Potongan:</span>
                  <span style={{fontWeight: 'bold'}}>-{formatCurrency(detail.subtotal)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px double black', marginTop: '2px', paddingTop: '2px' }}>
                <span>TOTAL:</span>
                <span>{isClient ? formatCurrency(grandTotal) : 'Rp 0'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PrintReceipt.displayName = 'PrintReceipt';
export default PrintReceipt;