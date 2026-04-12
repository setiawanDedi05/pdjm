'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table as ReusableTable, Column as TableColumn } from '@/components/ui/ReusableTable';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/Pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, Eye, ListOrdered } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Transaction, TransactionStatus } from '@/types';
import { useReactToPrint } from 'react-to-print';
import { useAuthStore } from '@/stores/authStore';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

const PrintReceipt = dynamic(() => import('@/components/PrintReceipt'), { ssr: false });

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function HutangPage() {
  const searchParams = useSearchParams(); 
  const [hutangList, setHutangList] = useState<Transaction[]>([]);
  const [status, setStatus] = useState( searchParams.get('status') || 'all');
  const [dueFilter, setDueFilter] = useState(searchParams.get('due') || 'all'); // 'all', '7', '10'
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const fetchHutangList = useCallback(async () => {
    setLoading(true);
    try {
      const q = status === 'all'
        ? `?metode=hutang&page=${page}&limit=${pageSize}`
        : `?metode=hutang&status=${status}&page=${page}&limit=${pageSize}`;
      const res = await fetch(`/api/transactions${q}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        let list: Transaction[] = data.data.transactions ?? [];
        // Apply due date filter
        if (dueFilter !== 'all') {
          const days = parseInt(dueFilter, 10);
          const now = new Date();
          list = list.filter(t => {
            if (!t.due_date) return false;
            const due = new Date(t.due_date);
            const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= days;
          });
        }
        setHutangList(list);
        setTotal(data.data.total ?? 0); // Note: total is not filtered, only for pagination
      }
    } catch(error) {
        console.error('Error fetching transactions:', error);
        toast.error('Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  }, [status, page, pageSize, dueFilter]);

  useEffect(() => { fetchHutangList(); }, [fetchHutangList]);

  function openDetail(t: Transaction) {
    setSelected(t);
    setDetailOpen(true);
  }

  async function handleUpdateStatus(status?: TransactionStatus) {
    if (!selected || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/transactions/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      toast.success('Status transaksi diperbarui');
      fetchHutangList();
      setDetailOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal update status');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h1>
          <p className="text-sm text-slate-500">Semua transaksi penjualan</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            status
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
          <Select value={dueFilter} onValueChange={v => { setDueFilter(v); setPage(1); }}>
            Jatuh Tempo
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Jatuh Tempo" />
            </SelectTrigger>
            <SelectContent className='bg-white'>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="7">≤ 7 Hari Lagi</SelectItem>
              <SelectItem value="10">≤ 10 Hari Lagi</SelectItem>
            </SelectContent>
          </Select>
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
                { key: 'total_price', header: 'Total', render: (t) => formatCurrency(t.total_price), className: 'text-right font-semibold' },
                { key: 'status', header: 'Status', render: (t) => (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status] ?? ''}`}>{t.status}</span>
                ) },
                { key: 'createdAt', header: 'Tanggal', render: (t) => <span className="text-xs text-slate-500">{formatDate(t.createdAt)}</span> },
                { key: 'due_date', header: 'Jatuh Tempo', render: (t) => <span className="text-xs text-slate-500">{t.due_date ? formatDate(t.due_date) : '-'}</span> },
                { key: 'actions', header: 'Aksi', render: (t) => (
                  <div className="flex justify-center">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDetail(t)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) },
              ]}
              data={hutangList}
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
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Detail Transaksi</DialogTitle>
                </DialogHeader>
                {selected && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-slate-500">Invoice:</span> <span className="font-mono font-semibold">{selected.invoice_number}</span></div>
                      <div><span className="text-slate-500">Tanggal:</span> <span>{formatDate(selected.createdAt)}</span></div>
                      <div><span className="text-slate-500">Tanggal Jatuh Tempo:</span> <span>{selected.due_date ? formatDate(new Date(selected.due_date)) : '-'}</span></div>
                      <div><span className="text-slate-500">Toko:</span> <span>{selected.toko_name}</span></div>
                      <div><span className="text-slate-500">Customer:</span> <span>{selected.customer_name}</span></div>
                      <div><span className="text-slate-500">No Telp:</span> <span>{selected.no_telp}</span></div>
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
                          {(selected.details ?? []).map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="text-sm">{d.product?.name ?? '-'}</TableCell>
                              <TableCell className="text-right">{d.qty}</TableCell>
                              <TableCell className="text-right">{formatCurrency(d.price_at_time)}</TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(d.subtotal)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="font-bold text-right">TOTAL</TableCell>
                            <TableCell className="font-bold text-right text-orange-600">{formatCurrency(selected.total_price)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex gap-2 pt-2 items-center">
                      {selected.status === 'pending'  ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus('paid')}
                            disabled={isUpdating}
                          >
                            {isUpdating ? 'Menyimpan...' : 'Tandai Lunas'}
                          </Button>
                      ) : null}
                      {selected.status === 'pending'  ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus('cancelled')}
                            disabled={isUpdating}
                          >
                            {isUpdating ? 'Menyimpan...' : 'Batalkan'}
                          </Button>
                      ) : null}
                      <Button size="sm" variant="outline" onClick={() => handlePrint()} className="ml-auto">
                        <Printer className="h-3.5 w-3.5 mr-1" /> Cetak
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
      {/* Hidden print area */}
      {selected && (
        <div className="hidden">
          {selected ? <PrintReceipt ref={printRef} transaction={selected} /> : null}
        </div>
      )}
    </div>
  );
}

