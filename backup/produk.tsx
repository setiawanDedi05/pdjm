'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table as ReusableTable } from '@/components/ui/ReusableTable';
import { Pagination } from '@/components/ui/Pagination';
import { Plus, Search, Edit, Trash2, Package, QrCode, Printer, Upload, Loader2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency, generateShortId } from '@/lib/utils';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { useReactToPrint } from 'react-to-print';
import QRCode from 'react-qr-code';
import PrintQrLabel from '@/components/PrintQrLabel';

const EMPTY_FORM = {
  serial_number: '',
  name: '',
  description: '',
  stock: 0,
  minimum_stock: 0,
  price_buy: 0,
  price_sell: 0,
  buy_date: new Date().toISOString().slice(0, 10),
  suplier: '',
  alias_supplier: '',
};

export default function ProductsPage() {
  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  
  // Action States
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const qrPrintRef = useRef<HTMLDivElement>(null);
  const handlePrintQr = useReactToPrint({ contentRef: qrPrintRef });

  // Fetch Data with Search Debounce logic inside useEffect
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const q = `?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`;
      const res = await fetch(`/api/products${q}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
      }
    } catch {
      toast.error('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    const delayDebounce = setTimeout(fetchProducts, 400);
    return () => clearTimeout(delayDebounce);
  }, [fetchProducts]);

  // Form Handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const openCreate = () => {
    setEditProduct(null);
    setForm({ ...EMPTY_FORM, serial_number: generateShortId().toUpperCase() });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      ...p,
      buy_date: p.buy_date?.split('T')[0] ?? EMPTY_FORM.buy_date
    } as any);
    setDialogOpen(true);
  };

  // Logic Import Excel (Optimized for performance)
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      
      if (rows.length === 0) throw new Error('File kosong');

      // Mapping logic... (bisa disederhanakan dengan asumsi header fixed)
      const payload = rows.map(row => ({
        serial_number: String(row['Serial'] || row['serial'] || generateShortId()).trim(),
        name: String(row['Nama'] || row['nama'] || '').trim(),
        stock: Number(row['Stok'] || row['stok']) || 0,
        price_buy: Number(row['Harga Beli']) || 0,
        price_sell: Number(row['Harga Jual']) || 0,
        // ... field lainnya
      }));

      // Sebaiknya buat 1 API endpoint khusus untuk bulk upload
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Gagal import bulk server-side');
      
      toast.success('Berhasil mengimport data');
      setImportDialogOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('Nama wajib diisi');
    setSaving(true);
    try {
      const isEdit = !!editProduct;
      const res = await fetch(isEdit ? `/api/products/${editProduct.id}` : '/api/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      toast.success(isEdit ? 'Produk diperbarui' : 'Produk ditambahkan');
      setDialogOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Table Columns Definition
  const columns = useMemo(() => [
    { 
      key: 'serial_number', 
      header: 'Serial', 
      render: (p: Product) => (
        <div className="flex flex-col">
          <span className="font-mono text-[10px] text-slate-400 leading-none">
            {p.alias_supplier || 'NO-ALIAS'}
          </span>
          <span className="font-bold text-slate-700 uppercase">{p.serial_number}</span>
        </div>
      )
    },
    { key: 'name', header: 'Nama Produk', className: 'font-medium' },
    { 
      key: 'stock', 
      header: 'Stok', 
      render: (p: Product) => (
        <div className="flex flex-col items-end">
          <span className={`font-bold ${p.stock <= p.minimum_stock ? 'text-red-500' : 'text-slate-700'}`}>
            {p.stock}
          </span>
          <span className="text-[10px] text-slate-400">Min: {p.minimum_stock}</span>
        </div>
      ),
      className: 'text-right' 
    },
    { 
      key: 'prices', 
      header: 'Harga (Beli/Jual)', 
      render: (p: Product) => (
        <div className="text-right">
          <div className="text-[10px] text-slate-400 line-through">{formatCurrency(p.price_buy)}</div>
          <div className="font-bold text-orange-600">{formatCurrency(p.price_sell)}</div>
        </div>
      )
    },
    { 
      key: 'actions', 
      header: 'Aksi', 
      render: (p: Product) => (
        <div className="flex gap-1 justify-center">
          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => { setQrProduct(p); setQrDialogOpen(true); }}>
            <QrCode className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:bg-slate-100" onClick={() => openEdit(p)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(p)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-[120px]'
    },
  ], []);

  const handleDelete = async (p: Product) => {
    if (!confirm(`Hapus produk "${p.name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        toast.success('Produk terhapus');
        fetchProducts();
      }
    } catch { toast.error('Gagal menghapus'); }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-slate-500">Total {products.length} produk dalam daftar ini</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="shadow-sm border-slate-200">
            <Upload className="h-4 w-4 mr-2" /> Import
          </Button>
          <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-200">
            <Plus className="h-4 w-4 mr-2" /> Produk Baru
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-none shadow-xl shadow-slate-200/60 overflow-hidden bg-white">
        <CardHeader className="p-4 bg-slate-50/50 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari SKU atau nama barang..."
              className="pl-10 bg-white border-slate-200 focus:ring-orange-500"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-slate-400" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ReusableTable<Product>
            columns={columns}
            data={products}
            loading={loading}
            emptyText={
              <div className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 font-medium">Produk tidak ditemukan</p>
              </div>
            }
            rowKey={(row) => row.id}
          />
        </CardContent>
      </Card>

      {/* Footer / Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
          <span>Baris per halaman:</span>
          <select 
            className="bg-transparent border-b-2 border-slate-200 focus:border-orange-500 outline-none px-1 py-0.5"
            value={pageSize} 
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {[10, 25, 50].map(sz => <option key={sz} value={sz}>{sz}</option>)}
          </select>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Optimized Dialogs (Contoh Edit/Add) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editProduct ? 'Perbarui Produk' : 'Tambah Produk Baru'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Serial Number / SKU</Label>
              <Input name="serial_number" value={form.serial_number} onChange={handleFormChange} className="font-mono uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Nama Barang</Label>
              <Input name="name" value={form.name} onChange={handleFormChange} placeholder="Contoh: Kampas Rem Depan" />
            </div>
            <div className="space-y-2">
              <Label>Harga Beli</Label>
              <Input name="price_buy" type="number" value={form.price_buy} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label>Harga Jual</Label>
              <Input name="price_sell" type="number" value={form.price_sell} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label>Stok Saat Ini</Label>
              <Input name="stock" type="number" value={form.stock} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label>Stok Minimum (Alert)</Label>
              <Input name="minimum_stock" type="number" value={form.minimum_stock} onChange={handleFormChange} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="ghost">Batal</Button></DialogClose>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 px-8">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Produk
            </Button>
          </DialogFooter>
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