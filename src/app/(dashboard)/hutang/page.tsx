'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, Eye, ListOrdered } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Transaction, TransactionStatus } from '@/types';
import { useReactToPrint } from 'react-to-print';
import { useAuthStore } from '@/stores/authStore';
import dynamic from 'next/dynamic';

const PrintReceipt = dynamic(() => import('@/components/PrintReceipt'), { ssr: false });

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function HutangPage() {
  const { user } = useAuthStore();
  const [hutangList, setHutangList] = useState<Transaction[]>([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const fetchHutangList = useCallback(async () => {
    setLoading(true);
    try {
      const q = status === 'all' ? `?metode=hutang` : `?metode=hutang&status=${status}`;
      const res = await fetch(`/api/transactions${q}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setHutangList(data.data.transactions ?? []);
    } catch(error) {
        console.error('Error fetching transactions:', error);
        toast.error('Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  }, [status]);

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Toko</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>No Telp</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400">Memuat...</TableCell></TableRow>
              ) : hutangList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <ListOrdered className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-slate-400">Belum ada transaksi</p>
                  </TableCell>
                </TableRow>
              ) : (
                hutangList.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.invoice_number}</TableCell>
                    <TableCell className="font-medium">{t.toko_name}</TableCell>
                    <TableCell className="font-medium">{t.customer_name}</TableCell>
                    <TableCell className="font-medium">{t.no_telp}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(t.total_price)}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status] ?? ''}`}>
                        {t.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(t.createdAt)}</TableCell>
                    <TableCell className="text-xs text-slate-500">{t.due_date ? formatDate(new Date(t.due_date)) : '-'}</TableCell>
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
        </CardContent>
      </Card>

      {/* Detail Dialog */}
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
          <PrintReceipt ref={printRef} transaction={selected} />
        </div>
      )}
    </div>
  );
}

