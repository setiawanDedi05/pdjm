import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

export function apiResponse<T>(
  data?: T,
  message?: string,
  status = 200
): Response {
  return Response.json(
    {
      success: status >= 200 && status < 300,
      data,
      message,
    },
    { status }
  );
}

export function apiError(error: string, status = 400): Response {
  return Response.json(
    { success: false, error },
    { status }
  );
}

export function handleApiError(error: unknown): Response {
  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') {
      return apiError('Unauthorized - silakan login', 401);
    }
    if (error.message === 'FORBIDDEN') {
      return apiError('Forbidden - tidak memiliki akses', 403);
    }
    return apiError(error.message, 400);
  }
  return apiError('Terjadi kesalahan server', 500);
}

export const generateShortId = () => {
  return crypto.randomBytes(3).toString('hex'); // 3 bytes = 6 karakter hex
};

export const generateLongId = () => {
  return crypto.randomBytes(6).toString('hex'); // 6 bytes = 12 karakter hex
};

interface ProgressCalculation {
  current: number;
  total: number;
  fallback?: number;
}

export const calculateProgress = ({ current, total, fallback = 0 }: ProgressCalculation): number => {
  // 1. Defensif terhadap pembagian nol (Division by Zero)
  if (total <= 0) return fallback;

  // 2. Hitung persentase
  const percentage = (current / total) * 100;

  // 3. Clamp value antara 0 - 100 & bulatkan
  return Math.min(Math.max(Math.round(percentage), 0), 100);
};

