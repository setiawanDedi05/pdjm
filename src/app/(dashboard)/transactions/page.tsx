'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/Pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, Eye, ListOrdered } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Transaction, TransactionDetail, TransactionStatus } from '@/types';
import { useReactToPrint } from 'react-to-print';
import { useAuthStore } from '@/stores/authStore';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/stores/appStore';

const PrintSmallReceipt = dynamic(() => import('@/components/PrintSmallReceipt'), { ssr: false });
const PrintBigReceipt = dynamic(() => import('@/components/PrintReceipt'), { ssr: false });

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const {user} = useAuthStore()
  const [status, setStatus] = useState('all');
  const {setLoading} = useAppStore();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [potongan, setPotongan] = useState<{
    data: TransactionDetail[];
    total: number;
  }>({
    data: [],
    total: 0
  });
  const [serviceFees, setServiceFees] = useState<{
    data: TransactionDetail[];
    total: number;
  }>({
    data: [],
    total: 0
  });
  const [products, setProducts] = useState<{
    data: TransactionDetail[],
    total: number
  }>({
    data: [],
    total: 0
  });  
  const [detailOpen, setDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingMidtrans, setIsCheckingMidtrans] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingPage, setPendingPage] = useState<number|null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const bigPrintRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });
  const handleBigPrint = useReactToPrint({ contentRef: bigPrintRef });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.append('status', status);
      params.append('page', String(page));
      params.append('limit', String(pageSize));
      const res = await fetch(`/api/transactions?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data.transactions ?? []);
        setTotalPages(Math.max(1, Math.ceil((data.data.total || 0) / pageSize)));
      }
    } catch {
      toast.error('Gagal memuat transaksi');
    } finally {
      setLoading(false);
      setPendingPage(null);
    }
  }, [status, page, pageSize]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  function openDetail(t: Transaction) {
    setSelected(t);
    setDetailOpen(true);
  }

  async function handleUpdateStatus() {
    if (!selected || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/transactions/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      toast.success('Status transaksi diperbarui');
      fetchTransactions();
      setDetailOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal update status');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleCekStatusMidtrans() {
    if (!selected || isCheckingMidtrans) return;
    const orderId = selected.midtrans_order_id || selected.invoice_number;
    setIsCheckingMidtrans(true);
    try {
      const res = await fetch(`/api/midtrans/status/${orderId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal memeriksa status Midtrans');

      const midtransStatus: string = data.data.transaction_status;
      let mappedStatus: TransactionStatus;
      if (midtransStatus === 'settlement' || midtransStatus === 'capture') {
        mappedStatus = 'paid';
      } else if (midtransStatus === 'pending') {
        mappedStatus = 'pending';
      } else {
        mappedStatus = 'cancelled';
      }

      if (mappedStatus === selected.status) {
        toast.info(`Status Midtrans: ${midtransStatus} (tidak ada perubahan)`);
        return;
      }

      const patchRes = await fetch(`/api/transactions/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: mappedStatus }),
        credentials: 'include',
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok || !patchData.success) throw new Error(patchData.error || 'Gagal memperbarui status');

      toast.success(`Status diperbarui: ${mappedStatus}`);
      fetchTransactions();
      setDetailOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memeriksa status Midtrans');
    } finally {
      setIsCheckingMidtrans(false);
    }
  }

  useEffect(() => {
    setPotongan({
      data: selected?.details?.filter((d) => d.product_type === 'discount') || [],
      total: selected?.details?.filter((d) => d.product_type === 'discount').reduce((acc, d) => Number(acc) + Number(d.subtotal), 0) || 0,
    });
    setServiceFees({
      data: selected?.details?.filter((d) => d.product_type === 'service') || [],
      total: selected?.details?.filter((d) => d.product_type === 'service').reduce((acc, d) => Number(acc) + Number(d.subtotal), 0) || 0,
    })
    setProducts({
      data: selected?.details?.filter((d) => d.product_type === 'part') || [],
      total: selected?.details?.filter((d) => d.product_type === 'part').reduce((acc, d) => Number(acc) + Number(d.subtotal), 0) || 0,
    })
  },[selected])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h1>
          <p className="text-sm text-slate-500">Semua transaksi penjualan</p>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent className='bg-white'>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-0" />
        <CardContent>
          <div className="relative">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plat</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <ListOrdered className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                      <p className="text-slate-400">Belum ada transaksi</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.invoice_number}</TableCell>
                      <TableCell className="font-medium">{t.customer_name}</TableCell>
                      <TableCell>{t.vehicle_plate}</TableCell>
                      <TableCell className="uppercase text-xs">{t.payment_method}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(t.total_price)}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status] ?? ''}`}>
                          {t.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{formatDate(t.createdAt)}</TableCell>
                      <TableCell className="text-center">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDetail(t)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
                page={pendingPage ?? page}
                totalPages={totalPages}
                onPageChange={(p) => {
                  if (p !== page) {
                    setPendingPage(p);
                    setPage(p);
                  }
                }}
              />
            </div>
          </div>
      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Admin/Kasir:</span> <span className="font-mono font-semibold">{selected.user.name}({selected.user.username})</span></div>
                <div><span className="text-slate-500">Invoice:</span> <span className="font-mono font-semibold">{selected.invoice_number}</span></div>
                <div><span className="text-slate-500">Tanggal:</span> <span>{formatDate(selected.createdAt)}</span></div>
                <div><span className="text-slate-500">Customer:</span> <span>{selected.customer_name}</span></div>
                <div><span className="text-slate-500">Plat:</span> <span>{selected.vehicle_plate}</span></div>
                <div><span className="text-slate-500">Metode:</span> <span className="uppercase">{selected.payment_method}</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Status:</span>
                  <Badge className={`text-xs ${statusColors[selected.status] ?? ''}`}>{selected.status}</Badge>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.data.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm">{d.product?.name ?? d.product_name ?? '-'}</TableCell>
                        <TableCell className="text-right">{d.qty}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d.price_at_time)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(d.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                    {serviceFees.data.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm">Service {d.product?.name ?? d.product_name ?? '-'}</TableCell>
                        <TableCell className="text-right py-1"></TableCell>
                        <TableCell className="text-right py-1"></TableCell>
                        <TableCell className="text-right py-1 font-semibold">{formatCurrency(d.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className='border-0'>
                      <TableCell colSpan={3} className="font-bold text-right">TOTAL</TableCell>
                      <TableCell className="font-bold text-right">{formatCurrency(Number(selected.total_price) + potongan.total)}</TableCell>
                    </TableRow>
                    {potongan.data.map((d) => (
                      <TableRow key={d.id} className='border-0'>
                        <TableCell className="text-sm py-0">Potongan {d.product?.name ?? d.product_name ?? '-'}</TableCell>
                        <TableCell className="text-right py-0"></TableCell>
                        <TableCell className="text-right py-0"></TableCell>
                        <TableCell className="text-right font-bold text-red-500 py-0">- {formatCurrency(d.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                    {potongan.total > 0 && (
                      <TableRow className='border-0'>
                      <TableCell colSpan={3} className="font-bold text-right">GRAND TOTAL</TableCell>
                      <TableCell className="font-bold text-right">{formatCurrency(selected.total_price)}</TableCell>
                    </TableRow>
                    )}
                    </TableBody>
                </Table>
              </div>
              <div className="flex gap-2 pt-2 items-center">
                {selected.status === 'pending'  ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUpdateStatus}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Menyimpan...' : 'Batalkan'}
                    </Button>
                ) : null}
                {selected.status === 'pending' && selected.payment_method === 'qris' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCekStatusMidtrans}
                    disabled={isCheckingMidtrans}
                  >
                    {isCheckingMidtrans ? 'Memeriksa...' : 'Cek Status Midtrans'}
                  </Button>
                )}
                <div className='flex gap-2 ml-auto'>
                {selected.status !== 'cancelled' &&  
                  <Button size="sm" variant="outline" onClick={() => handlePrint()} className="ml-auto">
                    <Printer className="h-3.5 w-3.5 mr-1" /> Cetak Struk Kecil
                </Button>
                }
                {selected.status !== 'cancelled' && user?.role === 'admin' &&  
                  <Button size="sm" variant="outline" onClick={() => handleBigPrint()} className="ml-auto">
                    <Printer className="h-3.5 w-3.5 mr-1" /> Cetak Struk Besar
                </Button>
                }
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden print area */}
      {selected && (
        <div className="hidden">
          <PrintSmallReceipt ref={printRef} transaction={selected} potongan={potongan} servicefees={serviceFees} products={products} />
        </div>
      )}
      {selected && (
        <div className="hidden">
          <PrintBigReceipt ref={bigPrintRef} transaction={selected} potongan={potongan} servicefees={serviceFees} products={products} />
        </div>
      )}
    </div>
  );
}