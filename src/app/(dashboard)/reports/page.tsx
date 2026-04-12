'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, TrendingUp, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Transaction } from '@/types';

interface ReportSummary {
  totalRevenue: number;
  totalTransactions: number;
  totalItemsSold: number;
  avgTransaction: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ReportSummary>({
    totalRevenue: 0, totalTransactions: 0, totalItemsSold: 0, avgTransaction: 0,
  });
  const [hutangSummary, setHutangSummary] = useState({ count: 0, total: 0 });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all transactions (not just paid)
      const res = await fetch('/api/transactions?limit=200', { credentials: 'include' });
      const data = await res.json();
      if (!data.success) return;

      const all: Transaction[] = data.data.transactions ?? [];
      const now = new Date();
      // Filter for summary cards (paid only)
      const filtered = all.filter((t) => {
        const date = new Date(t.createdAt);
        if (period === 'day') {
          return t.status === 'paid' && date.toDateString() === now.toDateString();
        }
        if (period === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return t.status === 'paid' && date >= weekAgo;
        }
        if (period === 'month') {
          return t.status === 'paid' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
        return t.status === 'paid';
      });

      setTransactions(filtered);
      const totalRevenue = filtered.reduce((s, t) => Number(s) + Number(t.total_price), 0);
      const totalItemsSold = filtered.reduce(
        (s, t) => s + (t.details?.reduce((si, d) => si + d.qty, 0) ?? 0), 0
      );
      setSummary({
        totalRevenue,
        totalTransactions: filtered.length,
        totalItemsSold,
        avgTransaction: filtered.length > 0 ? totalRevenue / filtered.length : 0,
      });

      // Hutang summary: payment_method === 'hutang', status === 'pending', due date within 10 days
      const hutang = all.filter((t) => {
        if (t.payment_method !== 'hutang' || t.status !== 'pending' || !t.due_date) return false;
        const due = new Date(t.due_date);
        const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 10;
      });
      setHutangSummary({
        count: hutang.length,
        total: hutang.reduce((s, t) => Number(s) + Number(t.total_price), 0),
      });
    } catch {
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const stats = [
    { label: 'Total Pendapatan', value: formatCurrency(summary.totalRevenue), icon: TrendingUp, color: 'text-green-600' },
    { label: 'Total Transaksi', value: summary.totalTransactions, icon: ShoppingCart, color: 'text-blue-600' },
    { label: 'Item Terjual', value: summary.totalItemsSold, icon: Package, color: 'text-purple-600' },
    { label: 'Rata-rata Transaksi', value: formatCurrency(summary.avgTransaction), icon: BarChart3, color: 'text-orange-600' },
  ];

  const periodLabel: Record<string, string> = { day: 'Hari Ini', week: '7 Hari Terakhir', month: 'Bulan Ini', all: 'Semua Waktu' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Penjualan</h1>
          <p className="text-sm text-slate-500">Ringkasan pendapatan dan transaksi</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Hari Ini</SelectItem>
            <SelectItem value="week">7 Hari Terakhir</SelectItem>
            <SelectItem value="month">Bulan Ini</SelectItem>
            <SelectItem value="all">Semua Waktu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-slate-500">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${color}`}>{loading ? '—' : value}</div>
              <p className="text-xs text-slate-400 mt-0.5">{periodLabel[period]}</p>
            </CardContent>
          </Card>
        ))}
        {/* Hutang summary card - clickable */}
        <Card
          className="col-span-2 lg:col-span-1 border-orange-400 cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push('/hutang?due=10&status=pending')}
          tabIndex={0}
          role="button"
          aria-label="Lihat hutang jatuh tempo 10 hari"
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-orange-700 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" /> Hutang Jatuh Tempo ≤ 10 Hari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600">{loading ? '—' : `${hutangSummary.count} transaksi`}</div>
            <div className="text-xs text-slate-400 mt-0.5">Total: {loading ? '—' : formatCurrency(hutangSummary.total)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Transaksi Terbayar — {periodLabel[period]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plat</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Memuat...</TableCell></TableRow>
              ) : transactions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Tidak ada transaksi pada periode ini</TableCell></TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.invoice_number}</TableCell>
                    <TableCell className="font-medium">{t.customer_name}</TableCell>
                    <TableCell>{t.vehicle_plate}</TableCell>
                    <TableCell className="uppercase text-xs">{t.payment_method}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(t.total_price)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

