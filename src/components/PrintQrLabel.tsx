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
        }}
      >
        <QRCode
          value={product.serial_number}
          size={90}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
        />
        {/* Store name */}
        <div style={{
          display:'flex',
          flexDirection: 'column',
          marginLeft: '4mm',
        }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
              {product.name.length > 20 ? product.name.slice(0, 17) + '...' : product.name}
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '9px' }}>
              {product.description ? (product.description.length > 30 ? product.description.slice(0, 27) + '...' : product.description) : 'No description'}
            </div>

            <div
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: '9px',
                letterSpacing: '0.5px',
              }}
              >
              {`${product.alias_supplier}/${product.buy_date ? new Date(product.buy_date).toISOString().slice(0, 10) : 'unknown'}`}
            </div>
        </div>
      </div>
    );
  }
);

PrintQrLabel.displayName = 'PrintQrLabel';
export default PrintQrLabel;

