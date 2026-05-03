"use client";

import { 
  User, ShieldCheck, ShoppingCart, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { formatDate, formatDateShort } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const AkunPage = () => {
    const {user, logout} = useAuthStore();
    const router = useRouter();
    const handleLogout = async () => {
        await logout();
        router.push('/login');
    }

  return (
    <div className="min-h-screen bg-[#F8FAFC] md:p-8">
      {/* Container - Mobile First: Full width on mobile, max-width on desktop */}
      <div className="max-w-4xl mx-auto bg-white md:rounded-3xl overflow-hidden">
        {/* 1. Header Profile & Role Badge */}
        <div className={`p-6 md:p-10 text-white ${user?.role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center overflow-hidden">
                <User size={48} strokeWidth={1.5} />
              </div>
              <div className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-lg">
                {user?.role === 'admin' ? <ShieldCheck size={20} className="text-indigo-600" /> : <ShoppingCart size={20} className="text-emerald-600" />}
              </div>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{user?.name.toUpperCase()}({user?.username})</h1>
                <span className="px-3 py-0.5 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider border border-white/30">
                  {user?.role}
                </span>
              </div>
              <p className="text-white/80 font-mono text-sm">ID: {user?.id} • { user?.createdAt ? formatDate(user.createdAt) : "-"}</p>
            </div>
          </div>
        </div>

        {/* 3. Action Menu - Mobile First Slicing */}
        <div className="p-6 md:hidden">
          {/* 4. Danger Zone */}
          <div className="mt-10 pt-8 border-t border-slate-100">
            <button onClick={handleLogout} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition-colors">
              <LogOut size={18} /> Logout from Device
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AkunPage;