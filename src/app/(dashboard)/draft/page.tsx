'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table as ReusableTable } from '@/components/ui/ReusableTable';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Transaction } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';

export default function DraftPage() {
    const router = useRouter();
    const {setCustomerName, setNoTelp, setPaymentMethod, addServiceFee, clearCart, setTokoName, setTransactionId, setVehiclePlate, addItem} = useCartStore();
    const [draftList, setDraftList] = useState<Transaction[]>([]);
    const {loading, setLoading} = useAppStore();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

  const fetchDraftList = useCallback(async () => {
    setLoading(true);
    try {
      const q = 
        `?status=draft&page=${page}&limit=${pageSize}`;
      const res = await fetch(`/api/transactions${q}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setDraftList(data.data.transactions);
        setTotal(data.data.total ?? 0); // Note: total is not filtered, only for pagination
      }
    } catch(error) {
        console.error('Error fetching transactions:', error);
        toast.error('Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchDraftList(); }, [fetchDraftList]);

  const handleLanjutPembayaran = async (transaction: Transaction) => {
    //salin data ke transaksi ke cart store zustand
    setCustomerName(transaction.customer_name);
    setNoTelp(transaction.no_telp ?? "");
    setPaymentMethod(transaction.payment_method);
    setTokoName(transaction.toko_name ?? "");
    setVehiclePlate(transaction.vehicle_plate);
    clearCart();
    transaction?.details?.forEach((item) => {
        console.log({item})
        if(item.product_id){
            const product = {
                id: item.product_id,
                serial_number: item.product?.serial_number ?? "",
                name: item.product?.name ?? "",
                description: item.product?.description ?? "",
                stock: Number(item.product?.stock) ?? 0,
                minimum_stock: Number(item.product?.minimum_stock) ?? 0,
                price_buy: Number(item.product?.price_buy) ?? 0,
                price_sell: Number(item.product?.price_sell) ?? 0,
                buy_date: item.product?.buy_date ?? "",
                suplier: item.product?.suplier ?? "",
                alias_supplier: item.product?.alias_supplier ?? "",
                createdAt: item.product?.createdAt ?? new Date(),
                updatedAt: item.product?.updatedAt ?? new Date()
            }
            addItem(product, item.qty);
        }else{
            addServiceFee({
                serviceName: item.product_name ?? "",
                servicePrice: Number(item.price_at_time)
            });
        }
    });
    setTransactionId(transaction.id);
    //pindak ke kasir page
    router.push('/kasir');
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h1>
          <p className="text-sm text-slate-500">Draft Transaksi</p>
        </div>
      </div>
      <Card>
        <CardHeader className="pb-0" />
        <CardContent>
          <div className="relative">
            <ReusableTable<Transaction>
              columns={[
                { key: 'invoice_number', header: 'Invoice', className: 'font-mono text-xs' },
                { key: 'toko_name', header: 'Toko', className: 'font-medium' },
                { key: 'customer_name', header: 'Customer' },
                { key: 'no_telp', header: 'No Telp' },
                { key: 'payment_method', header: 'Metode Pembayaran' },
                { key: 'total_price', header: 'Total', render: (t) => formatCurrency(t.total_price), className: 'text-right font-semibold' },
                { key: 'createdAt', header: 'Tanggal', render: (t) => <span className="text-xs text-slate-500">{formatDate(t.createdAt)}</span> },
                { key: 'actions', header: 'Aksi', render: (t) => (
                  <div className="flex justify-center">
                    <Button variant="outline" className="w-full" onClick={() => handleLanjutPembayaran(t)}>
                      Lanjut
                    </Button>
                  </div>
                ) },
              ]}
              data={draftList}
              loading={loading}
            />
          </div>
              </CardContent>
            </Card>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Tampilkan</span>
              <select
                className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                {[5, 10, 20, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-sm text-slate-600">per halaman</span>
            </div>
            <div className="flex justify-end w-full sm:w-auto">
              <Pagination
                page={page}
                totalPages={Math.max(1, Math.ceil(total / pageSize))}
                onPageChange={setPage}
              />
            </div>
          </div>
    </div>
  );
}

