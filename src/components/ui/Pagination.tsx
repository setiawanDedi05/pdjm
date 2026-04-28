import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'; // Opsional: gunakan icon agar lebih clean

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    const startPage = Math.max(2, page - 1);
    const endPage = Math.min(totalPages - 1, page + 1);

    if (startPage > 2) pages.push('ellipsis-start');
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < totalPages - 1) pages.push('ellipsis-end');
    
    pages.push(totalPages);
    return pages;
  };

  return (
    <nav 
      className={`
        flex items-center w-full 
        /* Mobile: menyebar ke ujung */
        justify-between 
        /* Desktop: berkumpul di tengah */
        sm:justify-end sm:gap-4 
        ${className || ''}
      `}
    >
      {/* Tombol Previous */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="h-9 w-9 sm:w-auto sm:px-4 flex-shrink-0 transition-all hover:border-orange-500 hover:text-orange-500"
      >
        <ChevronLeft className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      {/* Kontainer Angka & Info */}
      <div className="flex items-center">
        
        {/* VIEW MOBILE: Tetap seperti permintaan sebelumnya */}
        <div className="flex sm:hidden items-center gap-2">
          <span className="text-sm font-semibold px-3 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
            {page} <span className="text-orange-300 mx-0.5">/</span> {totalPages}
          </span>
        </div>

        {/* VIEW DESKTOP: Sekarang lebih rapat dan rapi */}
        <div className="hidden sm:flex items-center gap-1.5">
          {getPageNumbers().map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span key={idx} className="px-1 text-slate-400">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              );
            }
            const isActive = p === page;
            return (
              <Button
                key={p}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(p)}
                className={`h-9 w-9 p-0 font-medium transition-all ${
                  isActive 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500 shadow-sm scale-105' 
                    : 'hover:border-orange-500 hover:text-orange-500'
                }`}
              >
                {p}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Tombol Next */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="h-9 w-9 sm:w-auto sm:px-4 flex-shrink-0 transition-all hover:border-orange-500 hover:text-orange-500"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4 sm:ml-2" />
      </Button>
    </nav>
  );
}