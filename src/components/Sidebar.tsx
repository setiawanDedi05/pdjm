'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Package,
  BarChart3,
  ListOrdered,
  LogOut,
  Wrench,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';

/** Routes accessible by every authenticated role */
const sharedNav = [
  { href: '/kasir', label: 'Kasir', icon: ShoppingCart },
  { href: '/admin/products', label: 'Produk', icon: Package },
  { href: '/admin/transactions', label: 'Transaksi', icon: ListOrdered },
  { href: '/admin/stock', label: 'Stok Masuk', icon: TrendingDown },
];

/** Extra routes that are admin-only */
const adminOnlyNav = [
  { href: '/admin/reports', label: 'Laporan', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const navItems =
    user?.role === 'admin' ? [...sharedNav, ...adminOnlyNav] : sharedNav;

  async function handleLogout() {
    await logout();
    router.push('/login');
    toast.success('Berhasil logout');
  }

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 p-5 border-b border-slate-700">
        <div className="bg-orange-500 rounded-lg p-1.5">
          <Wrench className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm">Pada Jaya Motor</div>
          <div className="text-xs text-slate-400 capitalize">{user?.role || '-'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/kasir' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800 mb-2">
          <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.username}</div>
            <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Keluar
        </Button>
      </div>
    </aside>
  );
}

