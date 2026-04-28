"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [showAlert, setShowAlert] = useState(false);
  const hasAlert = lowStockProducts.count > 0 || pendingHutangTransactions.count > 0;
  return (
    <div className="fixed z-50 right-4 bottom-4 max-w-full flex flex-col items-end rounded-lg">
        {showAlert && (
        <div className="w-[400px] max-w-full space-y-4 mb-5">
          <Card className="bg-red-400">
            <CardHeader>
              <CardTitle className="text-lg">Produk Stok Rendah ({lowStockProducts.count})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-[100px] overflow-y-auto scrollbar-thin 
                scrollbar-thumb-slate-300 
                scrollbar-track-slate-100 
                hover:scrollbar-thumb-slate-400
                dark:scrollbar-thumb-slate-700 
                dark:scrollbar-track-slate-900'>
                {lowStockProducts.count === 0 ? (
                  <div className="text-sm text-muted-foreground">Semua stok aman.</div>
                ) : (
                  <ul className="text-sm list-disc pl-5">
                    {lowStockProducts.rows.map((p, i) => {
                      return (
                        <li key={p.id}>
                          {p.name} - Stok: {p.stock} (Minimum: {p.minimum_stock})
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-500">
            <CardHeader>
              <CardTitle className="text-lg">Transaksi Hutang Jatuh Tempo (&lt;= 10 hari)({pendingHutangTransactions.count})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-[100px] overflow-y-auto'>
                {pendingHutangTransactions.count === 0 ? (
                <div className="text-sm text-muted-foreground">Tidak ada hutang mendekati jatuh tempo.</div>
              ) : (
                <ul className="text-sm list-disc pl-5">
                  {pendingHutangTransactions.rows.map((t, i) => (
                    (
                      <li key={t.id}>
                        {t.customer_name} - Jatuh tempo: {new Date(t.due_date ?? '').toLocaleDateString('id-ID')} (Rp{Number(t.total_price).toLocaleString('id-ID')})
                      </li>
                    )
                  ))}
                </ul>
              )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <Button
        variant={hasAlert ? 'destructive' : 'outline'}
        size="icon"
        className="mb-2 shadow-lg animate-bounce bg-red-600 rounded-full cursor-pointer size-12"
        aria-label="Tampilkan Alert"
        onClick={() => setShowAlert(!showAlert)}
      >
        <CircleAlertIcon size={96} className='text-white' />
      </Button>
    </div>
  );
}
