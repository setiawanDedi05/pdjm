"use client";

import { useAuthStore } from '@/stores/authStore';
import { redirect } from 'next/navigation';

export default function Home() {
  const auth = useAuthStore();
    if (auth.user?.role === 'admin') {
      redirect('/reports');
    } else {
      redirect('/kasir');
  }
}
