'use client';

import { BottomNav } from '@/components/BottomNav';
import { FloatingAlert } from '@/components/FloatingAlert';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = new URLSearchParams(window.location.search);
  const [lowStockProducts, setLowStockProducts] = useState({rows: [], count: 0});
  const [pendingHutangTransactions, setPendingHutangTransactions] = useState({rows: [], count: 0});
  const fetchLowStockProducts = async () => {
    try {
      const res = await fetch('/api/products/low-stock');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setLowStockProducts(data.data);
      return data.data;
    } catch (err) {
      toast.error('Gagal mengambil produk dengan stok rendah');
    }
  };

  const fetchPendingHutangTransactions = async () => {
    try {
      const res = await fetch('/api/transactions/hutang/due-date');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setPendingHutangTransactions(data.data);
      return data.data;
    } catch (err) {
      toast.error('Gagal mengambil transaksi hutang yang tertunda');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLowStockProducts();
      fetchPendingHutangTransactions();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar />
        <FloatingAlert
          lowStockProducts={lowStockProducts}
          pendingHutangTransactions={pendingHutangTransactions}
          />
      </div>
      <main className="flex-1 overflow-auto bg-slate-50">{children}</main>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

