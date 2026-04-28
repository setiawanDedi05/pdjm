'use client';

import { useState, useEffect, useCallback } from 'react';
import { RevenueLineChart, ProductSaleBarChart, ProductInBarChart } from '@/components/ui/Charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, ShoppingCart, Package, LoaderIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Transaction } from '@/types';
import { useAppStore } from '@/stores/appStore';

interface ReportSummary {
  totalRevenue: number;
  totalTransactions: number;
  totalItemsSold: number;
  avgTransaction: number;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('month');
  const {loading, setLoading} = useAppStore();
  const [summary, setSummary] = useState<ReportSummary>({
    totalRevenue: 0, totalTransactions: 0, totalItemsSold: 0, avgTransaction: 0,
  });
  const [chartPeriod, setChartPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [productSaleData, setProductSaleData] = useState<any[]>([]);
  const [productInData, setProductInData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  // Fetch chart data
  useEffect(() => {
    setChartLoading(true);
    Promise.all([
      fetch(`/api/reports/summary?period=${chartPeriod}`).then(r => r.json()),
      fetch(`/api/reports/product-sale?period=${chartPeriod}`).then(r => r.json()),
      fetch(`/api/reports/product-in?period=${chartPeriod}`).then(r => r.json()),
    ]).then(([rev, sale, prodIn]) => {
      setRevenueData(rev.data ?? []);
      setProductSaleData(sale.data ?? []);
      setProductInData(prodIn.data ?? []);
    }).finally(() => setChartLoading(false));
  }, [chartPeriod]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all transactions (not just paid)
      const res = await fetch('/api/transactions', { credentials: 'include' });
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
        if (period === 'year') {
          return t.status === 'paid' && date.getFullYear() === now.getFullYear();
        }
        return t.status === 'paid';
      });

      const totalRevenue = filtered.reduce((s, t) => Number(s) + Number(t.total_price), 0);
      const totalItemsSold = filtered.reduce(
        (s, t) => s + (t.details?.reduce((si, d) => si + (d.product_id ? d.qty : 0), 0) ?? 0), 0
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
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Penjualan</h1>
          <p className="text-sm text-slate-500">Ringkasan pendapatan dan transaksi</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 items-end">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='bg-white'>
              <SelectItem value="day">Hari Ini</SelectItem>
              <SelectItem value="week">7 Hari Terakhir</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
      </div>

      {/* Grafik Section */}
      <div className="bg-white rounded-lg shadow p-12 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Grafik Penjualan & History Produk</h1>
            <p className="text-sm text-slate-500">Ringkasan pendapatan dan produk</p>
          </div>
          <Select value={chartPeriod} onValueChange={v => setChartPeriod(v as any)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='bg-white'>
              <SelectItem value="day">Harian</SelectItem>
              <SelectItem value="month">Bulanan</SelectItem>
              <SelectItem value="year">Tahunan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            {chartLoading ? (
              <div className="w-full h-72 flex items-center justify-center">
                <LoaderIcon className="animate-spin text-muted-foreground" />
              </div>
            ) : 
            <RevenueLineChart data={revenueData} title="Pendapatan" />
            }
          </div>
          <div>
             {chartLoading ? (
              <div className="w-full h-72 flex items-center justify-center">
                <LoaderIcon className="animate-spin text-muted-foreground" />
              </div>
            ) : <ProductSaleBarChart data={productSaleData} title="Produk Terjual" />}
          </div>
          <div>
             {chartLoading ? (
              <div className="w-full h-72 flex items-center justify-center">
                <LoaderIcon className="animate-spin text-muted-foreground" />
              </div>
            ) : 
            <ProductInBarChart data={productInData} title="Produk Masuk" />}
          </div>
        </div>
      </div>
    </div>
  );
}

