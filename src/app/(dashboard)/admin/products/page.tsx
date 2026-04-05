'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Package, QrCode, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { useReactToPrint } from 'react-to-print';
import QRCode from 'react-qr-code';
import PrintQrLabel from '@/components/PrintQrLabel';

const emptyForm = { serial_number: '', name: '', category: '', stock: 0, price_buy: 0, price_sell: 0, buy_date: '', buy_from: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const qrPrintRef = useRef<HTMLDivElement>(null);
  const handlePrintQr = useReactToPrint({ contentRef: qrPrintRef });

  function openQr(p: Product) {
    setQrProduct(p);
    setQrDialogOpen(true);
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/products${q}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch {
      toast.error('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  function openCreate() {
    setEditProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setForm({
      serial_number: p.serial_number,
      name: p.name,
      category: p.category,
      stock: p.stock,
      price_buy: p.price_buy,
      price_sell: p.price_sell,
      buy_date: p.buy_date ? p.buy_date.toString().slice(0, 10) : '',
      buy_from: p.buy_from ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.serial_number || !form.name || !form.category) {
      toast.error('Serial, nama, dan kategori wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
      const method = editProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, stock: Number(form.stock), price_buy: Number(form.price_buy), price_sell: Number(form.price_sell) }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      toast.success(editProduct ? 'Produk diperbarui' : 'Produk ditambahkan');
      setDialogOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Hapus produk "${p.name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      toast.success('Produk dihapus');
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Produk</h1>
          <p className="text-sm text-slate-500">Kelola data produk dan suku cadang</p>
        </div>
        <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> Tambah Produk
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama atau serial number..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="text-right">Harga Beli</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Memuat...</TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-slate-400">Tidak ada produk</p>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.serial_number}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                    <TableCell className="text-right">
                      <span className={p.stock <= 5 ? 'text-red-600 font-bold' : ''}>{p.stock}</span>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(p.price_buy)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.price_sell)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-500" title="Lihat QR Code" onClick={() => openQr(p)}>
                          <QrCode className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDelete(p)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Add/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1">
              <Label>Serial Number</Label>
              <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} placeholder="SN-001" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Nama Produk</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Oli Mesin 1L" />
            </div>
            <div className="space-y-1">
              <Label>Kategori</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Oli" />
            </div>
            <div className="space-y-1">
              <Label>Stok</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} min={0} />
            </div>
            <div className="space-y-1">
              <Label>Harga Beli (Rp)</Label>
              <Input type="number" value={form.price_buy} onChange={(e) => setForm({ ...form, price_buy: Number(e.target.value) })} min={0} />
            </div>
            <div className="space-y-1">
              <Label>Harga Jual (Rp)</Label>
              <Input type="number" value={form.price_sell} onChange={(e) => setForm({ ...form, price_sell: Number(e.target.value) })} min={0} />
            </div>
            <div className="space-y-1">
              <Label>Tanggal Beli</Label>
              <Input type="date" value={form.buy_date} onChange={(e) => setForm({ ...form, buy_date: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Beli Dari (Supplier)</Label>
              <Input value={form.buy_from} onChange={(e) => setForm({ ...form, buy_from: e.target.value })} placeholder="Nama supplier/vendor" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog QR Code */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>QR Code Produk</DialogTitle>
          </DialogHeader>
          {qrProduct && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="p-4 bg-white border rounded-lg">
                <QRCode
                  value={qrProduct.serial_number}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="font-mono text-xs text-slate-500">{qrProduct.serial_number}</p>
                <p className="font-semibold text-sm">{qrProduct.name}</p>
                <Badge variant="outline">{qrProduct.category}</Badge>
              </div>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => handlePrintQr()}
              >
                <Printer className="h-4 w-4 mr-2" /> Cetak Label QR
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden QR print area */}
      {qrProduct && (
        <div className="hidden">
          <PrintQrLabel ref={qrPrintRef} product={qrProduct} />
        </div>
      )}
    </div>
  );
}

