'use client';

import { forwardRef, useEffect, useState } from 'react';
import type { Transaction, TransactionDetail } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PrintSmallReceiptProps {
  transaction: Transaction;
  products: { data: TransactionDetail[]; total: number; };
  servicefees: { data: TransactionDetail[]; total: number; };
  potongan: { data: TransactionDetail[]; total: number; };
}

const PrintSmallReceipt = forwardRef<HTMLDivElement, PrintSmallReceiptProps>(
  ({ transaction, products, servicefees, potongan }, ref) => {
    const [isClient, setIsClient] = useState(false);
    const grandTotal = products.total + servicefees.total - potongan.total;
    const isHutang = transaction.payment_method?.toLowerCase() === 'hutang';
    const username = transaction.user?.username;
    const name = transaction.user?.name;

    useEffect(() => {
      setIsClient(true);
    }, []);

    // Story-telling via Code: 
    // Kita buat SVG dengan opacity sangat rendah (10-15%) agar printer thermal tidak nge-blok hitam.
    // PT. TERBUKA dibuat besar (Size 14), Username dibuat kecil (Size 7).
    const watermarkSvg = `
      <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
        <text 
          x="50%" 
          y="50%" 
          font-family="monospace" 
          fill="rgba(0, 0, 0, 0.12)" 
          text-anchor="middle" 
          transform="rotate(-40, 60, 60)"
          style="font-weight: bold; letter-spacing: 1px;"
        >
          <tspan x="60" dy="-0.5em" font-size="14">PDJM</tspan>
          <tspan x="60" dy="1.4em" font-size="10" font-weight="normal">${name}(${username})</tspan>
        </text>
      </svg>
    `.replace(/"/g, "'").replace(/>\s+</g, '><');

    const watermarkDataUrl = `url("data:image/svg+xml,${encodeURIComponent(watermarkSvg)}")`;

    if (!isClient) return null;

    return (
      <div
        ref={ref}
        className="print-receipt bg-white text-black relative"
        style={{
          width: '58mm',
          padding: '2mm',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '12px',
          lineHeight: '1.2',
          overflow: 'hidden', // Menghindari SVG bocor keluar container
        }}
      >
        {/* WATERMARK LAYER */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: watermarkDataUrl,
            backgroundRepeat: 'repeat',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        {/* CONTENT LAYER */}
        {/* Kita bungkus konten dalam relative z-10 agar selalu berada di atas watermark */}
        <div className="relative z-10">
          {/* HEADER */}
          <div className="text-center mb-4">
            <div className="font-bold text-[14px] uppercase">Pada Jaya Motor</div>
            <div className="text-[10px]">Kp. Pacet Beunying RT/RW. 01/07</div>
            <div className="text-[10px]">Telp: 0815-7527-1662</div>
          </div>

          {/* INFO TRANSAKSI */}
          <div className="border-b border-dashed border-black pb-2 mb-2 text-[11px]">
            <div className="flex justify-between font-bold">
              <span>{isHutang ? 'NOTA HUTANG' : 'NOTA CASH'}</span>
              <span>{transaction.invoice_number}</span>
            </div>
            <div>Tgl: {formatDate(transaction.createdAt)}</div>
            <div>Cust: {transaction.customer_name}</div>
            {transaction.toko_name && <div>Toko: {transaction.toko_name}</div> }
            {transaction.vehicle_plate && <div>Unit: {transaction.vehicle_plate}</div> }
            {transaction.no_telp && <div>Telp: {transaction.no_telp}</div> }
          </div>

          {/* ITEMS */}
          <div className="mb-2">
            {products.data.map((item) => (
              <div key={item.id} className="mb-2">
                <div className="block font-medium">{item.product?.name}</div>
                <div className="flex justify-between text-[11px]">
                  <span>{item.qty} x {formatCurrency(item.price_at_time)}</span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
              </div>
            ))}

            {servicefees.data.map((item) => (
              <div key={item.id} className="mb-2">
                <div className="block font-medium">SVC: {item.product_name}</div>
                <div className="flex justify-between text-[11px]">
                  <span>{item.qty} x {formatCurrency(item.price_at_time)}</span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* RINGKASAN HARGA */}
          <div className="border-t border-dashed border-black pt-2 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Subtotal:</span>
              <span>{formatCurrency(products.total + servicefees.total)}</span>
            </div>
            
            {potongan.data.map((p) => (
              <div key={p.id} className="flex justify-between text-[11px] italic">
                <span>Disc: {p.product_name}</span>
                <span>-{formatCurrency(p.subtotal)}</span>
              </div>
            ))}

            <div className="flex justify-between font-bold text-[13px] border-t border-double border-black pt-1 mt-1">
              <span>TOTAL:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            
            <div className="flex justify-between text-[11px]">
              <span>Bayar:</span>
              <span className="uppercase font-medium">{transaction.payment_method}</span>
            </div>

            {isHutang && (
               <div className="text-[10px] text-right font-bold mt-1">
                 Jatuh Tempo: {transaction.due_date ? formatDate(transaction.due_date) : '-'}
               </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="mt-6 flex justify-around text-[10px]">
            <div className="text-center">
              <div className="mb-8">Penerima</div>
              <div>(........)</div>
            </div>
            <div className="text-center">
              <div className="mb-8">Hormat Kami</div>
              <div>(........)</div>
            </div>
          </div>

          <div className="text-center mt-6 text-[10px] italic">
            Terima kasih atas kunjungannya
          </div>
        </div>
        
        {/* Tail Gap untuk Printer Thermal */}
        <div className="h-[10mm]"></div>
      </div>
    );
  }
);

PrintSmallReceipt.displayName = 'PrintSmallReceipt';
export default PrintSmallReceipt;