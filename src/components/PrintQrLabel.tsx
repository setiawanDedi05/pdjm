'use client';

import { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import type { Product } from '@/types';

interface PrintQrLabelProps {
  product: Product;
}

const PrintQrLabel = forwardRef<HTMLDivElement, PrintQrLabelProps>(
  ({ product }, ref) => {
    return (
      <div
        ref={ref}
        className="print-qr-label"
        style={{
          width: '60mm',
          padding: '4mm',
          background: '#fff',
          fontFamily: 'Arial, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3mm',
        }}
      >
        {/* Store name */}
        <div style={{ fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.5px' }}>
          Pada Jaya Motor
        </div>

        {/* QR Code */}
        <QRCode
          value={product.serial_number}
          size={140}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
        />

        {/* Serial number */}
        <div
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '9px',
            letterSpacing: '0.5px',
            textAlign: 'center',
          }}
        >
          {product.serial_number}
        </div>

        {/* Product name */}
        <div
          style={{
            fontSize: '10px',
            fontWeight: 'bold',
            textAlign: 'center',
            maxWidth: '52mm',
            wordBreak: 'break-word',
          }}
        >
          {product.name}
        </div>

        {/* Category */}
        <div style={{ fontSize: '9px', color: '#555', textAlign: 'center' }}>
          {product.category}
        </div>
      </div>
    );
  }
);

PrintQrLabel.displayName = 'PrintQrLabel';
export default PrintQrLabel;

