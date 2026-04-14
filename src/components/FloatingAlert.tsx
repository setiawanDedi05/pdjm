"use client";

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CircleAlertIcon } from 'lucide-react';
import { Transaction } from '@/models';

type FloatingAlertProps = {
  lowStockProducts: {
    rows: { id: string | number; name: string; stock: number; minimum_stock?: number }[],
    count: number;
  };
  pendingHutangTransactions: {
    rows: Transaction[],
    count: number;
  };
};

export function FloatingAlert({ lowStockProducts, pendingHutangTransactions }: FloatingAlertProps) {
  const [open, setOpen] = useState(false);
  const hasAlert = lowStockProducts.count > 0 || pendingHutangTransactions.count > 0;
  return (
    <div className="fixed z-50 right-4 bottom-4 max-w-full flex flex-col items-end rounded-lg">
        {open && (
        <div className="w-[400px] max-w-full space-y-4 mb-5">
          <Card className="bg-red-400">
            <CardHeader>
              <CardTitle className="text-lg">Produk Stok Rendah ({lowStockProducts.count})</CardTitle>
              {lowStockProducts.count === 0 ? (
                <div className="text-sm text-muted-foreground">Semua stok aman.</div>
              ) : (
                <ul className="text-sm list-disc pl-5">
                  {lowStockProducts.rows.map((p, i) => {
                    return i < 5 ? (
                      <li key={p.id}>
                        {p.name} - Stok: {p.stock} (Minimum: {p.minimum_stock})
                      </li>
                    ) : null;
                  })}
                </ul>
              )}
            </CardHeader>
          </Card>
          <Card className="bg-red-500">
            <CardHeader>
              <CardTitle className="text-lg">Transaksi Hutang Jatuh Tempo (&lt;= 10 hari)({pendingHutangTransactions.count})</CardTitle>
              {pendingHutangTransactions.count === 0 ? (
                <div className="text-sm text-muted-foreground">Tidak ada hutang mendekati jatuh tempo.</div>
              ) : (
                <ul className="text-sm list-disc pl-5">
                  {pendingHutangTransactions.rows.map((t, i) => (
                    i < 5 ? (
                      <li key={t.id}>
                        {t.customer_name} - Jatuh tempo: {new Date(t.due_date ?? '').toLocaleDateString('id-ID')} (Rp{Number(t.total_price).toLocaleString('id-ID')})
                      </li>
                    ) : null
                  ))}
                </ul>
              )}
            </CardHeader>
          </Card>
        </div>
      )}
      <Button
        variant={hasAlert ? 'destructive' : 'outline'}
        size="icon"
        className="mb-2 shadow-lg animate-bounce bg-red-600 rounded-full cursor-pointer size-12"
        aria-label="Tampilkan Alert"
        onClick={() => setOpen((v) => !v)}
      >
        <CircleAlertIcon size={96} className='text-white' />
      </Button>
    </div>
  );
}
