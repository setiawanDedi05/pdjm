'use client';

import { forwardRef, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import type { Product } from '@/types';

interface PrintQrLabelBulkProps {
  products: Product[];
}

const PrintQrLabelBulk = forwardRef<HTMLDivElement, PrintQrLabelBulkProps>(
  ({ products }, ref) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    if (!isClient || !products || products.length === 0) return null;

    return (
      <div
        ref={ref}
        className="print-receipt p-4 bg-white relative"
        style={{ 
          width: '210mm',
          height: '270mm',
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
        <div className='flex flex-wrap gap-2'>
          {products.map((product, index) => (
            <div key={`${product.id}-${index}`} className='flex border-2 border-dashed border-black w-[200px] p-2'>
              <div className='flex flex-col items-center'>
                    <QRCode
                        value={product.serial_number}
                        size={90}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="M"
                    />
                    <span className='text-xs'>
                    {product.serial_number}
                    </span>
                </div>
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
                    {`${product.alias_supplier}/${product.buy_date ? product.buy_date.split('T')[0] : 'unknown'}`}
                    </div>
                </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

PrintQrLabelBulk.displayName = 'PrintQrLabelBulk';
export default PrintQrLabelBulk;