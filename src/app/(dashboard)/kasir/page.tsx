'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingCart, Printer, QrCode, Banknote, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Transaction, Product } from '@/types';
import PrintReceipt from '@/components/PrintReceipt';
import { useReactToPrint } from 'react-to-print';

const QrScanner = dynamic(() => import('@/components/QrScanner'), { ssr: false });

export default function KasirPage() {
  const { user } = useAuthStore();
  const {
    items, customerName, vehiclePlate, paymentMethod,
    addItem, removeItem, updateQty, clearCart,
    setCustomerName, setVehiclePlate, setPaymentMethod,
    totalPrice,
  } = useCartStore();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [manualSerial, setManualSerial] = useState('');
  const [serviceFee, setServiceFee] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({ contentRef: printRef });

  async function scanProduct(serial: string) {
    console.log({serial})
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
    if (!customerName.trim() || !vehiclePlate.trim()) {
      toast.error('Nama customer dan nomor plat wajib diisi');
      return;
    }
    if (items.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    setIsCheckingOut(true);
    try {
      if (paymentMethod === 'qris' || paymentMethod === 'va') {
        await handleNonCashPayment();
      } else {
        await submitCheckout('paid');
      }
    } finally {
      setIsCheckingOut(false);
    }
  }

  async function submitCheckout(status?: string, midtransOrderId?: string) {
    const payload = {
      customer_name: customerName,
      vehicle_plate: vehiclePlate,
      payment_method: paymentMethod,
      status: status ?? 'paid',
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
    setLastTransaction(data.data);
    clearCart();
    return data.data;
  }

  async function handleSaveTransaction() {
    if (!customerName.trim() || !vehiclePlate.trim()) {
      toast.error('Nama customer dan nomor plat wajib diisi');
      return;
    }
    if (items.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }
    setIsSaving(true);
    try {
      await submitCheckout('pending');
      toast.success('Transaksi disimpan sebagai pending');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan transaksi');
    } finally {
      setIsSaving(false);
    }
  }

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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Info Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="customer">Nama Customer</Label>
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
          </CardContent>
        </Card>

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
              variant={paymentMethod !== 'qris' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('qris')}
              className="flex flex-col h-16 gap-1"
            >
              <QrCode className="h-5 w-5" />
              <span className="text-xs">Qris</span>
            </Button>
            <Button
              variant={paymentMethod !== 'va' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('va')}
              className="flex flex-col h-16 gap-1"
            >
              <CreditCard className="h-5 w-5" />
              <span className="text-xs">Virtual Account</span>
            </Button>
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
            onClick={handleCheckout}
            disabled={isCheckingOut || isSaving || items.length === 0}
          >
            {isCheckingOut
              ? 'Memproses...'
              : paymentMethod === 'qris'
              ? 'Bayar dengan QRIS'
              : `Bayar ${formatCurrency(total)}`}
          </Button>
          {paymentMethod === 'cash' && items.length > 0 && (
            <Button
              variant="outline"
              className="w-full border-slate-400 text-slate-700"
              onClick={handleSaveTransaction}
              disabled={isSaving || isCheckingOut}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}
            </Button>
          )}
          {lastTransaction && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handlePrint()}
            >
              <Printer className="h-4 w-4 mr-2" />
              Cetak Struk
            </Button>
          )}
          {items.length > 0 && (
            <Button variant="ghost" className="w-full text-red-500" onClick={clearCart}>
              Kosongkan Keranjang
            </Button>
          )}
        </div>
      </div>

      {/* Hidden Print Area */}
      {lastTransaction && (
        <div className="hidden">
          <PrintReceipt ref={printRef} transaction={lastTransaction} />
        </div>
      )}
    </div>
  );
}

