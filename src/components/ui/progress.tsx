'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value: number;
  showLabel?: boolean;
  colorVariant?: 'default' | 'success' | 'warning' | 'error';
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, showLabel = false, colorVariant = 'default', ...props }, ref) => {
  
  // Mapping warna untuk fleksibilitas desain
  const variants = {
    default: 'bg-blue-600',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
  };

  return (
    <div className="w-full space-y-2">
      {/* Label area dengan mobile-first thinking */}
      {showLabel && (
        <div className="flex justify-between items-end px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            System Status
          </span>
          <span className="text-sm font-mono font-medium text-slate-900">
            {Math.round(value)}%
          </span>
        </div>
      )}

      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          'relative h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner',
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full w-full flex-1 transition-all duration-500 ease-in-out relative',
            variants[colorVariant]
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        >
          {/* Shimmer Effect: Memberikan kesan "sedang bekerja" */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -skew-x-12" />
        </ProgressPrimitive.Indicator>
      </ProgressPrimitive.Root>
    </div>
  );
});

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };