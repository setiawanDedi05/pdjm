'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { StockLog, Product } from '@/types';

export default function StockPage() {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product_id: '', amount: 1, type: 'in' as 'in' | 'out', reason: 'purchase' as string });
  const [lowStock, setLowStock] = useState<Product[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, prodsRes] = await Promise.all([
        fetch('/api/stock-logs?limit=50', { credentials: 'include' }),
        fetch('/api/products', { credentials: 'include' }),
      ]);
      const logsData = await logsRes.json();
      const prodsData = await prodsRes.json();
      if (logsData.success) setLogs(logsData.data.logs ?? []);
      if (prodsData.success) {
        const prods: Product[] = prodsData.data;
        setProducts(prods);
        setLowStock(prods.filter((p) => p.stock <= 5));
      }
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAdjust() {
    if (!form.product_id) { toast.error('Pilih produk'); return; }
    if (form.amount < 1) { toast.error('Jumlah minimal 1'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/stock-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: Number(form.product_id), amount: Number(form.amount), type: form.type, reason: form.reason }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      toast.success(`Stok berhasil ${form.type === 'in' ? 'ditambah' : 'dikurangi'}`);
      setDialogOpen(false);
      setForm({ product_id: '', amount: 1, type: 'in', reason: 'purchase' });
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyesuaikan stok');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Stok</h1>
          <p className="text-sm text-slate-500">Penyesuaian stok dan riwayat pergerakan barang</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> Sesuaikan Stok
        </Button>
      </div>

      {/* Low stock warning */}
      {lowStock.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
              <AlertTriangle className="h-4 w-4" />
              Stok Menipis ({lowStock.length} produk)
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((p) => (
                <Badge key={p.id} variant="outline" className="border-amber-400 text-amber-700">
                  {p.name} ({p.stock})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock log table */}
      <Card>
        <CardHeader className="pb-0" />
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Memuat...</TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Belum ada riwayat stok</TableCell></TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.product?.name ?? '-'}</TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1 text-xs font-medium ${log.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {log.type === 'in'
                          ? <><TrendingUp className="h-3 w-3" /> Masuk</>
                          : <><TrendingDown className="h-3 w-3" /> Keluar</>}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{log.amount}</TableCell>
                    <TableCell className="capitalize text-slate-500">{log.reason}</TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(log.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjust Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sesuaikan Stok</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Produk</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} (Stok: {p.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipe</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'in' | 'out', reason: v === 'in' ? 'purchase' : 'adjustment' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stok Masuk</SelectItem>
                    <SelectItem value="out">Stok Keluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Jumlah</Label>
                <Input type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Alasan</Label>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {form.type === 'in' ? (
                    <>
                      <SelectItem value="purchase">Pembelian Barang</SelectItem>
                      <SelectItem value="adjustment">Penyesuaian</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="sale">Penjualan</SelectItem>
                      <SelectItem value="adjustment">Penyesuaian</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAdjust} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

