'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Minus, Plus, Trash2, ShoppingCart, 
  Banknote, CreditCard, BanknoteXIcon, 
  PlusCircleIcon, MinusCircleIcon, Search 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Product } from '@/types';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogClose, DialogFooter 
} from '@/components/ui/dialog';

const QrScanner = dynamic(() => import('@/components/QrScanner'), { ssr: false });

export default function KasirPage() {
  const { user } = useAuthStore();
  const {
    items, customerName, vehiclePlate, paymentMethod,
    addItem, removeItem, updateQty, clearCart,
    setCustomerName, setVehiclePlate, setPaymentMethod,
    totalPrice, noTelp, tokoName, setTokoName, setNoTelp, serviceFee, setServiceFee, transactionId,
    setDiscount, discount 
  } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [manualSerial, setManualSerial] = useState('');
  const [hasMounted, setHasMounted] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => { setHasMounted(true); }, []);

  if (!hasMounted) return null;

  async function scanProduct(serial: string) {
    if (!serial.trim()) return;
    try {
      const res = await fetch(`/api/products/scan?serial=${encodeURIComponent(serial.trim())}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) return toast.error(data.error || 'Produk tidak ditemukan');
      
      const product: Product = data.data;
      if (product.stock <= 0) return toast.error(`Stok ${product.name} habis`);
      
      addItem(product);
      toast.success(`${product.name} masuk keranjang`);
      setManualSerial('');
    } catch { toast.error('Gagal mencari produk'); }
  }

  const debtValidation = () => {
    if (!customerName.trim() && !tokoName?.trim()) {
      toast.error('Isi Nama Customer/Toko untuk Hutang');
      return false;
    }
    if (!noTelp?.trim()) {
      toast.error('Isi Nomor Telepon untuk Hutang');
      return false;
    }
    return true;
  };

  async function submitCheckout(status?: string, midtransOrderId?: string) {
    const payload = {
      customer_name: customerName,
      vehicle_plate: vehiclePlate,
      toko_name: tokoName,
      no_telp: noTelp,
      payment_method: paymentMethod,
      status: status ?? (paymentMethod === 'cash' ? 'paid' : 'pending'),
      midtrans_order_id: midtransOrderId ?? null,
      total_price: total,
      service_fees: serviceFee.map(fee => ({
        service_name: fee.serviceName,
        service_price: fee.servicePrice,
      })),
      discount: discount.map(d => ({
        discount_name: d.discountName,
        discount_price: d.discountPrice
      })),
      items: items.map((i) => ({
        product_id: i.product.id,
        qty: i.qty,
        price_at_time: i.product.price_sell,
        subtotal: i.subtotal,
      })),
    };

    const apiNewTransaction ='/api/transactions';
    const apiOldTransaction = `/api/transactions/${transactionId}`;

    const res = await fetch(transactionId ? apiOldTransaction : apiNewTransaction, {
      method: transactionId ? 'PUT': 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    })

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Checkout gagal');
    clearCart();
    setServiceFee([]);
    setDiscount([]);
    setShowTransferModal(false);
    return data.data;
  }

  async function handleCheckout() {
    if (items.length === 0) return;
    if (paymentMethod === 'hutang' && !debtValidation()) return;

    setIsCheckingOut(true);
    try {
      if (paymentMethod === 'cash') {
        await submitCheckout('paid');
        toast.success('Pembayaran Tunai Berhasil');
      } else if (paymentMethod === 'hutang') {
        await submitCheckout('pending');
        toast.success('Tercatat sebagai Hutang');
      } else {
        await submitCheckout('paid');
      }
    } catch (e: any) {
        toast.error(e.message);
    } finally { setIsCheckingOut(false); }
  }

  const handleSaveTransaction = async () => {
    if (items.length === 0) return;
    if (paymentMethod === 'hutang' && !debtValidation()) return;
    setIsSaving(true);
    try {
      await submitCheckout('draft');
      toast.success('Transaksi disimpan');
    } catch (err: any) {
      toast.error(err.message);
    } finally { setIsSaving(false); }
  };

    const handleCancelTransaction = async () => {
      try {
        const res = await fetch(`/api/transactions/${transactionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "cancelled" }),
          credentials: 'include',
        });
        const data = await res.json();
        clearCart()
        if (!res.ok || !data.success) throw new Error(data.error);
        toast.success('transaksi dibatalkan');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Gagal cancel transaksi');
      }
    }

  const itemsTotal = totalPrice();
  const total = itemsTotal + serviceFee.reduce((sum, fee) => sum + fee.servicePrice, 0) - discount.reduce((sum, dis) => sum + dis.discountPrice, 0);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      {/* Modal Transfer */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Informasi Transfer</DialogTitle>
            <DialogDescription>Pastikan nominal sesuai dengan total tagihan.</DialogDescription>
          </DialogHeader>
          <div className="bg-slate-100 p-4 rounded-lg space-y-3 my-4 border border-dashed border-slate-300">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Bank</span>
              <b className="text-slate-900">BCA (Kode: 014)</b>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">No. Rekening</span>
              <b className="text-slate-900">0123123123</b>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Atas Nama</span>
              <b className="text-slate-900">Pada Jaya Motor</b>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleCheckout} className="w-full bg-orange-500 hover:bg-orange-600">Konfirmasi Sudah Bayar</Button>
            <DialogClose asChild>
              <Button variant="outline" className="w-full">Batal</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LEFT SIDE: SCANNER & LIST */}
      <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto pb-32 lg:pb-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kasir</h1>
            <p className="text-sm text-slate-500">Kelola transaksi harian Anda</p>
          </div>
          <Badge variant="secondary" className="px-3 py-1 bg-white border-slate-200 text-slate-700 shadow-sm">
            {user?.username} • {user?.role}
          </Badge>
        </header>

        {/* Scanner Section */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 p-5">
              <div className="aspect-video md:aspect-auto flex items-center justify-center relative">
                <QrScanner onScan={(text) => scanProduct(text)} onError={(err) => toast.error(err)} />
              </div>
              <div className="p-6 md:p-0 flex flex-col justify-center gap-4 bg-white">
                <div className="space-y-2 md:space-y-0">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Input Manual</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Scan atau ketik SKU/Serial..." 
                        className="pl-10"
                        value={manualSerial}
                        onChange={(e) => setManualSerial(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && scanProduct(manualSerial)}
                      />
                    </div>
                    <Button onClick={() => scanProduct(manualSerial)} variant="outline">Cari</Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cart List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2 text-slate-800">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              Item Keranjang ({items.length})
            </h2>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={clearCart}>
                Reset
              </Button>
            )}
          </div>

          <div className="grid gap-3">
            {items.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-12 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Keranjang masih kosong</p>
              </div>
            ) : (
              items.map((item) => (
                <Card key={item.product.id} className="border-none shadow-sm">
                  <CardContent className="p-4 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[150px]">
                      <h4 className="font-bold text-slate-800">{item.product.name}</h4>
                      <h5 className="font-bold text-slate-600">{item.product.description}</h5>
                      <p className="text-sm text-slate-500">{formatCurrency(item.product.price_sell)}</p>
                    </div>
                    <div className="flex items-center bg-slate-100 rounded-full p-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => updateQty(item.product.id, item.qty - 1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-bold text-sm">{item.qty}</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => updateQty(item.product.id, item.qty + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="font-bold text-slate-900">{formatCurrency(item.subtotal)}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="text-slate-300 hover:text-red-500" onClick={() => removeItem(item.product.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: PAYMENT & CUSTOMER */}
      <aside className="w-full lg:w-[400px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col gap-6 lg:h-screen lg:sticky lg:top-0 overflow-y-auto shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        
        {/* Payment Method Selector */}
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Metode Pembayaran</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cash', icon: Banknote, label: 'Tunai' },
              { id: 'transfer', icon: CreditCard, label: 'Transfer' },
              { id: 'hutang', icon: BanknoteXIcon, label: 'Hutang' },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as any)}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  paymentMethod === method.id 
                  ? 'border-orange-500 bg-orange-50 text-orange-600' 
                  : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                }`}
              >
                <method.icon className="h-6 w-6" />
                <span className="text-[10px] font-bold uppercase">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Form for Hutang */}
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Informasi Pelanggan</Label>
          <div className="grid gap-3">
            <Input placeholder="Nama Toko/Perusahaan" value={tokoName} onChange={(e) => setTokoName(e.target.value)} />
            <Input placeholder="Nama Penanggung Jawab" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Plat Nomor" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} />
              <Input placeholder="No. Telepon" value={noTelp} onChange={(e) => setNoTelp(e.target.value)} />
            </div>
          </div>
        </div>

        <Separator />

        {/* Service Fees */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Biaya Tambahan / Jasa</Label>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-orange-600" onClick={() => setServiceFee([...serviceFee, { serviceName: '', servicePrice: 0 }])}>
              <PlusCircleIcon className="h-4 w-4 mr-1" /> Tambah
            </Button>
          </div>
          
          <div className="space-y-2">
            {serviceFee.map((fee, index) => (
              <div key={index} className="flex gap-2 animate-in zoom-in-95">
                <Input 
                  placeholder="Nama Jasa" 
                  className="flex-[2]" 
                  value={fee.serviceName} 
                  onChange={(e) => {
                    const newFees = [...serviceFee];
                    newFees[index].serviceName = e.target.value;
                    setServiceFee(newFees);
                  }}
                />
                <Input 
                  placeholder="Harga" 
                  className="flex-[1]" 
                  type="number"
                  value={fee.servicePrice || ''}
                  onChange={(e) => {
                    const newFees = [...serviceFee];
                    newFees[index].servicePrice = Number(e.target.value);
                    setServiceFee(newFees);
                  }}
                />
                <Button size="icon" variant="ghost" className="text-slate-300" onClick={() => setServiceFee(serviceFee.filter((_, i) => i !== index))}>
                  <MinusCircleIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Discount Fees */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Potongan harga</Label>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-orange-600" onClick={() => setDiscount([...discount, { discountName: '', discountPrice: 0 }])}>
              <PlusCircleIcon className="h-4 w-4 mr-1" /> Tambah
            </Button>
          </div>
          
          <div className="space-y-2">
            {discount.map((item, index) => (
              <div key={index} className="flex gap-2 animate-in zoom-in-95">
                <Input 
                  placeholder="Nama Potongan" 
                  className="flex-[2]" 
                  value={item.discountName} 
                  onChange={(e) => {
                    const newDiscount = [...discount];
                    newDiscount[index].discountName = e.target.value;
                    setDiscount(newDiscount);
                  }}
                />
                <Input 
                  placeholder="Harga" 
                  className="flex-[1]" 
                  type="number"
                  value={item.discountPrice || ''}
                  onChange={(e) => {
                    const newDiscount = [...discount];
                    newDiscount[index].discountPrice = Number(e.target.value);
                    setDiscount(newDiscount);
                  }}
                />
                <Button size="icon" variant="ghost" className="text-slate-300" onClick={() => setDiscount(discount.filter((_, i) => i !== index))}>
                  <MinusCircleIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Final Summary Card */}
        <div className="mt-auto space-y-4">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-orange-500/10">
            <div className="space-y-2 mb-4 text-sm opacity-80">
               <div className="flex justify-between">
                <span>Subtotal Barang</span>
                <span>{formatCurrency(itemsTotal)}</span>
              </div>
              {serviceFee.length > 0 && (
                <div className="flex justify-between">
                  <span>Biaya Jasa</span>
                  <span>{formatCurrency(serviceFee.reduce((sum, f) => sum + f.servicePrice, 0))}</span>
                </div>
              )}
              {discount.length > 0 && (
                <div className="flex justify-between">
                  <span>Potongan</span>
                  <span className='text-red-500'>- {formatCurrency(discount.reduce((sum, f) => sum + f.discountPrice, 0))}</span>
                </div>
              )}
            </div>
            <Separator className="bg-white/10 mb-4" />
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Tagihan</span>
              <span className="text-2xl font-black text-orange-400">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="mb-12 md:mb-0 grid gap-2">
            <Button 
              className="w-full h-14 text-lg font-bold bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
              disabled={items.length === 0 || isCheckingOut}
              onClick={paymentMethod === 'transfer' ? () => setShowTransferModal(true) : handleCheckout}
            >
              {isCheckingOut ? 'Memproses...' : 'Proses Pembayaran'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-12 border-slate-200"
              disabled={isSaving || items.length === 0}
              onClick={handleSaveTransaction}
            >
              Simpan Sebagai Draft
            </Button>
            {transactionId && (  
              <Button 
                variant="outline" 
                className="w-full h-12 border-slate-200"
                onClick={handleCancelTransaction}
              >
                Batalkan Transaksi
              </Button>
              )
            }
          </div>
        </div>
      </aside>
    </div>
  );
}