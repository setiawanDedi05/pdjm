'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingCart, Printer, Banknote, CreditCard, BanknoteXIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Product } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

const QrScanner = dynamic(() => import('@/components/QrScanner'), { ssr: false });

export default function KasirPage() {
  const { user } = useAuthStore();
  const {
    items, customerName, vehiclePlate, paymentMethod,
    addItem, removeItem, updateQty, clearCart,
    setCustomerName, setVehiclePlate, setPaymentMethod,
    totalPrice, noTelp, tokoName, setTokoName, setNoTelp
  } = useCartStore();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [manualSerial, setManualSerial] = useState('');
  const [serviceFee, setServiceFee] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  const [hasMounted, setHasMounted] = useState(false);

  // Modal state for transfer info
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);


  // Jika belum di browser, jangan render apapun (atau render loading)
  if (!hasMounted) {
    return null; // atau <div className="p-4">Loading...</div>
  }

  async function scanProduct(serial: string) {
    if (!serial.trim()) return;
    try {
      const res = await fetch(`/api/products/scan?serial=${encodeURIComponent(serial.trim())}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Produk tidak ditemukan');
        return;
      }
      const product: Product = data.data;
      if (product.stock <= 0) {
        toast.error(`Stok ${product.name} habis`);
        return;
      }
      addItem(product);
      toast.success(`${product.name} ditambahkan ke keranjang`);
      setManualSerial('');
    } catch {
      toast.error('Gagal mencari produk');
    }
  }

  async function handleCheckout() {
   let isValid = items.length !== 0;
    if(paymentMethod === 'hutang'){
      isValid = debtValidation();
    }
    if (!isValid) return;

    setIsCheckingOut(true);
    try {
      switch (paymentMethod) {
        case 'cash':
          await submitCheckout('paid');
          toast.success('Transaksi disimpan sebagai pembayaran tunai');
          break;
        case 'hutang':
          await submitCheckout('pending');
          toast.success('Transaksi disimpan sebagai hutang');
          break;
        case 'transfer':
          await submitCheckout('paid');
          break;
      }
    } finally {
      setIsCheckingOut(false);
    }
  }

    const debtValidation = () => {
    if(customerName.trim() === '' && tokoName?.trim() === ''){
      toast.error('isi Nama customer atau Nama Toko untuk metode pembayaran Hutang');
      return false;
    }
    if(noTelp?.trim() === ''){
      toast.error('isi Nomor Telepon untuk metode pembayaran Hutang');
      return false;
    }
    return true
  }

  async function submitCheckout(status?: string, midtransOrderId?: string) {
    const payload = {
      customer_name: customerName,
      vehicle_plate: vehiclePlate,
      toko_name: tokoName,
      no_telp: noTelp,
      payment_method: paymentMethod,
      status: status ?? (paymentMethod === 'cash' ? 'paid' : 'pending'),
      midtrans_order_id: midtransOrderId ?? null,
      total_price: totalPrice() + serviceFee,
      service_fee: serviceFee,
      items: items.map((i) => ({
        product_id: i.product.id,
        qty: i.qty,
        price_at_time: i.product.price_sell,
        subtotal: i.subtotal,
      })),
    };

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Checkout gagal');
    clearCart();
    return data.data;
  }

  async function handleSaveTransaction() {
    let isValid = items.length !== 0;
    if(paymentMethod === 'hutang'){
      isValid = debtValidation();
    }
    if (!isValid) return;
    setIsSaving(true);
    try {
      await submitCheckout('pending');
      toast.success('Transaksi disimpan sebagai pending');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan transaksi');
    } finally {
      setIsSaving(false);
      setShowTransferModal(false);
    }
  }

  // pembayaran non-cash (transfer) menggunakan Midtrans Snap
  async function handleNonCashPayment() {
    const orderId = `INV-${Date.now()}`;
    const tokenRes = await fetch('/api/midtrans/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        gross_amount: totalPrice() + serviceFee,
        customer_name: customerName,
        vehicle_plate: vehiclePlate,
        payment_method: paymentMethod
      }),
      credentials: 'include',
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.success) {
      throw new Error(tokenData.error || 'Gagal mendapatkan token Midtrans');
    }
    
    const snapToken = tokenData.data.token;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).snap?.pay(snapToken, {
      onSuccess: async () => { await submitCheckout('paid', orderId); },
      onPending: async () => { await submitCheckout('pending', orderId); toast.info('Pembayaran pending'); },
      onError: () => { toast.error('Pembayaran gagal'); },
      onClose: () => { toast.info('Pembayaran dibatalkan'); },
    });
  }

  const itemsTotal = totalPrice();
  const total = itemsTotal + serviceFee;

  return (
    <div className="flex h-screen overflow-y">
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Informasi Transfer</DialogTitle>
            <DialogDescription>
              Silakan lakukan transfer ke rekening berikut:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div><b>Nama Pemilik Kartu:</b> Pada Jaya Motor</div>
            <div><b>Bank:</b> BCA</div>
            <div><b>No. Rekening:</b> 0123123123</div>
          </div>
          <DialogClose asChild>
            <>
            <Button onClick={handleCheckout} className="mt-4 w-full bg-orange-500 outline text-white" variant="secondary">Bayar</Button>
            <Button className="w-full outline" variant="default">Tutup</Button>
            </>
          </DialogClose>
        </DialogContent>
      </Dialog>
      {/* LEFT: Scanner + Product List */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Kasir</h1>
          <Badge variant="outline">
            {user?.username} · {user?.role}
          </Badge>
        </div>

        {/* Scanner */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Scan / Input Serial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <QrScanner
              onScan={(text) => scanProduct(text)}
              onError={(err) => toast.error(err)}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Ketik serial number..."
                value={manualSerial}
                onChange={(e) => setManualSerial(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && scanProduct(manualSerial)}
              />
              <Button onClick={() => scanProduct(manualSerial)} variant="outline">Cari</Button>
            </div>
          </CardContent>
        </Card>

        {/* Cart Items */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Keranjang ({items.length} item)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Keranjang kosong</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.product.price_sell)} / pcs</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQty(item.product.id, item.qty - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQty(item.product.id, item.qty + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-semibold w-24 text-right">{formatCurrency(item.subtotal)}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => removeItem(item.product.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Customer Info + Payment */}
      <div className="w-80 flex flex-col bg-white border-l border-slate-200 p-4 gap-4">
        {/* Payment Method */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button
              variant={paymentMethod !== 'cash' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('cash')}
              className="flex flex-col h-16 gap-1"
            >
              <Banknote className="h-5 w-5" />
              <span className="text-xs">Cash</span>
            </Button>
            <Button
              variant={paymentMethod !== 'transfer' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('transfer')}
              className="flex flex-col h-16 gap-1"
            >
              <CreditCard className="h-5 w-5" />
              <span className="text-xs">Transfer</span>
            </Button>
            <Button
              variant={paymentMethod !== 'hutang' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('hutang')}
              className="flex flex-col h-16 gap-1"
            >
              <BanknoteXIcon className="h-5 w-5" />
              <span className="text-xs">Hutang</span>
            </Button>
          </CardContent>
        </Card>

        <Card style={{display: paymentMethod !== 'hutang' ? 'none' : 'block'}}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Info Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="toko">Nama Perusahaan/Toko</Label>
              <Input
                id="toko"
                placeholder="Contoh: Toko Budi"
                value={tokoName}
                onChange={(e) => setTokoName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="customer">Nama Customer/Penanggung Jawab</Label>
              <Input
                id="customer"
                placeholder="Contoh: Budi Santoso"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plate">Nomor Plat</Label>
              <Input
                id="plate"
                placeholder="Contoh: B 1234 XYZ"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="notelp">Nomor Telepon</Label>
              <Input
                id="notelp"
                placeholder="Contoh: 081234567890"
                value={noTelp}
                onChange={(e) => setNoTelp(e.target.value.toUpperCase())}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Ringkasan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 mb-4">
              {items.map((i) => (
                <div key={i.product.id} className="flex justify-between text-xs text-slate-600">
                  <span className="truncate max-w-[140px]">{i.product.name} x{i.qty}</span>
                  <span>{formatCurrency(i.subtotal)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-2" />
            <div className="space-y-2 mb-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Biaya Jasa (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  value={serviceFee}
                  onChange={(e) => setServiceFee(Math.max(0, Number(e.target.value)))}
                  className="h-8 text-sm"
                />
              </div>
              {serviceFee > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal Barang</span>
                  <span>{formatCurrency(itemsTotal)}</span>
                </div>
              )}
              {serviceFee > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Biaya Jasa</span>
                  <span>{formatCurrency(serviceFee)}</span>
                </div>
              )}
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-base">
              <span>TOTAL</span>
              <span className="text-orange-600">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12"
            onClick={paymentMethod === 'transfer' ? () => setShowTransferModal(true) : handleCheckout}
            disabled={isCheckingOut || isSaving || items.length === 0}
          >
            {isCheckingOut
              ? 'Memproses...'
              : `Bayar ${formatCurrency(total)}`}
          </Button>
          <Button
            variant="outline"
            className="w-full border-slate-400 text-slate-700"
            onClick={handleSaveTransaction}
            disabled={isSaving || isCheckingOut}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}
          </Button>
          {items.length > 0 && (
            <Button variant="ghost" className="w-full text-red-500" onClick={clearCart}>
              Kosongkan Keranjang
            </Button>
          )}
        </div>
      </div> 
    </div>
  );
}
