'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table as ReusableTable, Column } from '@/components/ui/ReusableTable';
import { Pagination } from '@/components/ui/Pagination';
import { Plus, Search, Edit, Trash2, Package, QrCode, Printer, Upload, ShoppingBag, ChartBar, ChartArea } from 'lucide-react';
import * as XLSX from 'xlsx';
import { calculateProgress, formatCurrency, generateShortId } from '@/lib/utils';
import { toast } from 'sonner';
import type { CartItem, Product } from '@/types';
import { useReactToPrint } from 'react-to-print';
import QRCode from 'react-qr-code';
import PrintQrLabel from '@/components/PrintQrLabel';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useCartStore } from '@/stores/cartStore';
import SmartNumericInput from '@/components/ui/SmartNumericInput';
import PrintQrLabelBulk from '@/components/PrintQrLabelBulk';
import { ProductChartPerMonth } from '@/components/ui/Charts';

const emptyForm = {
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
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogChart, setDialogChart] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const qrPrintRef = useRef<HTMLDivElement>(null);
  const qrPrintBulkRef = useRef<HTMLDivElement>(null);
  const { addItem  } = useCartStore();
  const handlePrintQr = useReactToPrint({ contentRef: qrPrintRef });
  const handlePrintQrBulk = useReactToPrint({
  contentRef: qrPrintBulkRef,
  documentTitle: 'QR_Labels',
  onAfterPrint: () => console.log('Print Success'),
  // Jika masih blank, coba tambahkan trigger delay
  print: async (printIframe) => {
    await new Promise(resolve => setTimeout(resolve, 500)); 
    printIframe?.contentWindow?.print();
  }
});
  const {setLoading, setProgress} = useAppStore();
  const [productSalesDataPerMonth, setProductSalesDataPerMonth] = useState<{
    content: {label: string, sale: number}[],
    product: Product | null
  }>({
    content: [],
    product: null
  });
  
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      setImportError(null);
      setLoading(true);
      setImportDialogOpen(false);
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (!rows || rows.length < 2) throw new Error('File kosong atau format salah');
        // Header: No, Nama, Keterangan, Stok, Harga Beli, Harga jual, Tanggal Beli, Suplier, alias
        const header = rows[0] as string[];
        const colMap = {
          no: header.findIndex((h) => /no/i.test(String(h))),
          serial: header.findIndex((h) => /serial/i.test(String(h))),
          name: header.findIndex((h) => /nama/i.test(String(h))),
          description: header.findIndex((h) => /keterangan/i.test(String(h))),
          stock: header.findIndex((h) => /stok/i.test(String(h))),
          minimum_stock: header.findIndex((h) => /minimum stok/i.test(String(h))),
          price_buy: header.findIndex((h) => /harga beli/i.test(String(h))),
          price_sell: header.findIndex((h) => /harga jual/i.test(String(h))),
          buy_date: header.findIndex((h) => /tanggal beli/i.test(String(h))),
          suplier: header.findIndex((h) => /suplier/i.test(String(h))),
          alias_supplier: header.findIndex((h) => /alias/i.test(String(h))),
        };
        // Validate columns
        if (Object.values(colMap).some((idx) => idx === -1)) throw new Error('Kolom tidak lengkap.');
        // Prepare products
        const imported = [];
        const errors = [];
        for (let i = 1; i < rows.length; i++) {
          setProgress(calculateProgress({
            current: i, total: rows.length
          }));
          const row = rows[i] as any[];
          if (!row[colMap.name]) continue;
          const product = {
            serial_number: String(row[colMap.serial]).trim(),
            name: String(row[colMap.name] || '').trim(),
            description: row[colMap.description] ? String(row[colMap.description]) : '',
            stock: Number(row[colMap.stock]) || 0,
            minimum_stock: Number(row[colMap.stock]) || 0,
            price_buy: Number(row[colMap.price_buy]) || 0,
            price_sell: Number(row[colMap.price_sell]) || 0,
            buy_date: row[colMap.buy_date] ? String(row[colMap.buy_date]).slice(1) : null,
            suplier: row[colMap.suplier] ? String(row[colMap.suplier]) : '',
            alias_supplier: row[colMap.alias_supplier] ? String(row[colMap.alias_supplier]).toUpperCase() : '',
          };
          try {
            const res = await fetch('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(product),
              credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Gagal import');
            imported.push(product.name);
          } catch (err: any) {
            errors.push(`Baris ${i + 1}: ${product.name} - ${err.message || err}`);
          }
        }
        fetchProducts();
        if (imported.length)
          toast.success(`${imported.length} produk berhasil diimport.`);
        if (errors.length)
          toast.error(`Beberapa produk gagal diimport:\n${errors.join('\n')}`);
      } catch (err: any) {
        setImportError(err.message || 'Gagal membaca file. Pastikan format Excel benar.');
      } finally {
        setImporting(false);
        setLoading(false)
      }
    };

  function openQr(p: Product) {
    setQrProduct(p);
    setQrDialogOpen(true);
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const q = `?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`;
      const res = await fetch(`/api/products${q}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.items || data.data);
        setTotalPages(data.data.totalPages || 1);
      }
    } catch {
      toast.error('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setForm(
      editProduct
        ? {
            serial_number: editProduct.serial_number ?? '',
            name: editProduct.name ?? '',
            description: editProduct.description ?? '',
            stock: editProduct.stock ?? 0,
            minimum_stock: editProduct.minimum_stock ?? 0,
            price_buy: editProduct.price_buy ?? 0,
            price_sell: editProduct.price_sell ?? 0,
            buy_date: editProduct.buy_date?.split('T')[0] ?? new Date().toISOString().slice(0, 10),
            suplier: editProduct.suplier ?? '',
            alias_supplier: editProduct.alias_supplier ?? '',
          }
        : { ...emptyForm, serial_number: generateShortId().toUpperCase() }
    );
  }, [dialogOpen]);

  function openCreate() {
    setEditProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name) {
      toast.error('Nama wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
      const method = editProduct ? 'PUT' : 'POST';
      const payload = { ...form, 
          buy_date: editProduct ? editProduct.buy_date : form.buy_date, 
          serial_number: editProduct ? editProduct.serial_number : form.serial_number,
          stock: Number(form.stock), 
          minimum_stock: Number(form.minimum_stock), 
          price_buy: Number(form.price_buy), 
          price_sell: Number(form.price_sell) 
        }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
  
  async function handleOpenChart(p:Product) {
    if(!p) return;
    setDialogChart(true);
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/product-sale/${p.id}?year=${new Date().getFullYear()}`, { credentials: 'include' });
      const response = await res.json();
      setProductSalesDataPerMonth(response.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus');
    } finally{
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Produk</h1>
          <p className="text-sm text-slate-500">Kelola data produk dan suku cadang</p>
        </div>
        {isAdmin && <div className="flex gap-2">
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => handlePrintQrBulk()}
              >
                <Printer className="h-4 w-4 mr-2" /> Cetak Label QR
          </Button>
          <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="border-orange-500 text-orange-600">
            <Upload className="h-4 w-4 mr-2" /> Import Excel
          </Button>
          <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" /> Tambah Produk
          </Button>
        </div>
       }
      </div>
      {/* Dialog Import Excel */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Produk dari Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="excel-upload">Pilih file Excel (.xlsx)</Label>
            <Input id="excel-upload" type="file" accept=".xlsx,.xls" onChange={handleImportExcel} disabled={importing} />
            <div className="text-xs text-slate-500">Kolom: No, Nama, Keterangan, Stok, Harga Beli, Harga jual, Tanggal Beli, Suplier, alias</div>
            {importError && <div className="text-red-500 text-xs">{importError}</div>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportDialogOpen(false)} disabled={importing}>Batal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex sm:hidden items-center gap-2">
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
      <Card>
        <CardHeader className="pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama atau serial number..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <ReusableTable<Product>
              columns={[
                { key: 'serial_number', header: 'Serial', render: (p) => `${p.serial_number.toUpperCase()}`, className: 'font-mono text-xs' },
                { key: 'name', header: 'Nama', className: 'font-medium' },
                { key: 'description', header: 'Description', render: (p) => p.description ?? '-', className: 'font-medium' },
                { key: 'stock', header: 'Stok', render: (p) => <span className={p.stock <= p.minimum_stock ? 'text-red-600 font-bold' : ''}>{p.stock}</span>, className: 'text-right' },
                { key: 'minimum_stock', header: 'Stok Minimum', render: (p) => <span>{p.minimum_stock}</span>, className: 'text-right' },
                { key: 'price_buy', header: 'Harga Beli', render: (p) => formatCurrency(p.price_buy), className: 'text-right' },
                { key: 'price_sell', header: 'Harga Jual', render: (p) => formatCurrency(p.price_sell), className: 'text-right' },
                { key: 'actions', header: 'Aksi', render: (p) => (
                  <div className="flex gap-1 justify-center">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => addItem(p, 1) }>
                      <ShoppingBag className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-500" title="Lihat QR Code" onClick={() => openQr(p)}>
                      <QrCode className="h-3.5 w-3.5" />
                    </Button>
                    {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    }
                    {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDelete(p)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    }
                    {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleOpenChart(p)}>
                        <ChartArea className="h-3.5 w-3.5" />
                      </Button>
                    }
                  </div>
                ), className: 'text-center' },
              ]}
              data={products}
              loading={false}
              emptyText={<><Package className="h-12 w-12 mx-auto mb-2 text-slate-300" /><p className="text-slate-400">Tidak ada produk</p></>}
              rowKey={(row) => row.id}
            />
          </div>
        </CardContent>
      </Card>
      <div className="mt-4 mb-16 grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
        <div className="hidden sm:flex items-center gap-2">
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
            totalPages={totalPages}
            onPageChange={(p) => {
              if (p !== page) {
                setPage(p);
              }
            }}
          />
        </div>
      </div>

      {/* Dialog Add/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1">
              <Label>Serial Number</Label>
              <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value.toUpperCase() })} placeholder="Serial number produk" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Nama Produk</Label>
              <Input value={form.name} autoFocus onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Oli Mesin 1L" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Keterangan</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi produk" />
            </div>
            <div className="space-y-1">
              <SmartNumericInput 
                label="Stok" 
                value={form.stock} 
                onChange={(val) => setForm({ ...form, stock: val })}
                isCurrency
              />
            </div>
            <div className="space-y-1">
              <SmartNumericInput 
                label="Minimum Stok" 
                value={form.minimum_stock} 
                onChange={(val) => setForm({ ...form, minimum_stock: val })}
                isCurrency
              />  
            </div>
            <div className="space-y-1">
              <SmartNumericInput 
                label="Harga Beli (Rp)" 
                value={form.price_buy} 
                onChange={(val) => setForm({ ...form, price_buy: val })}
                isCurrency
              />
            </div>
            <div className="space-y-1">
              <SmartNumericInput 
                label="Harga Jual (Rp)" 
                value={form.price_sell} 
                onChange={(val) => setForm({ ...form, price_sell: val })}
                isCurrency
              />  
            </div>
            <div className="space-y-1">
              <Label>Tanggal Beli</Label>
              <Input type="date" value={form.buy_date} onChange={(e) => setForm({ ...form, buy_date: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Supplier</Label>
              <Input value={form.suplier} onChange={(e) => setForm({ ...form, suplier: e.target.value })} placeholder="Nama supplier/vendor" />
            </div>
            <div className="space-y-1">
              <Label>Alias Supplier</Label>
              <Input value={form.alias_supplier} onChange={(e) => setForm({ ...form, alias_supplier: e.target.value.toUpperCase() })} placeholder="Alias supplier/vendor" maxLength={3} />
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

      {/* Dialog Chart */}
      <Dialog open={dialogChart} onOpenChange={setDialogChart}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grafik Penjualan Product {productSalesDataPerMonth?.product?.name}</DialogTitle>
          </DialogHeader>
          <ProductChartPerMonth data={productSalesDataPerMonth.content} />
        </DialogContent>
      </Dialog>

      {/* Hidden QR print area */}
      {qrProduct && (
        <div className="hidden">
          <PrintQrLabel ref={qrPrintRef} product={qrProduct} />
        </div>
      )}
      {products.length > 0 && (
        <div className="hidden">
          <PrintQrLabelBulk ref={qrPrintBulkRef} products={products} />
        </div>
      )}
    </div>
  );
}

