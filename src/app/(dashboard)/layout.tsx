'use client';

import AlertStock from '@/components/AlertStock';
import { BottomNav } from '@/components/BottomNav';
import { FloatingAlert } from '@/components/FloatingAlert';
import { FloatingCart } from '@/components/FloatingCart';
import Loading from '@/components/Loading';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const {user} = useAuthStore()
  const {items} = useCartStore()
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
    if(user?.role === 'admin') {
      const interval = setInterval(() => {
        fetchLowStockProducts();
        fetchPendingHutangTransactions();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Loading />
        <Sidebar />
        <AlertStock lowStockProducts={lowStockProducts} />
        {
        user?.role === 'admin' && <FloatingAlert
          lowStockProducts={lowStockProducts}
          pendingHutangTransactions={pendingHutangTransactions}
          />
        }
        {
          items.length > 0 && pathname === '/products' && <FloatingCart />
        }
      </div>
      <main className="flex-1 overflow-auto bg-slate-50">
        <Suspense fallback={<>...</>}>
          {children}
        </Suspense>
        </main>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

