import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

