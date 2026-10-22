'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-pine text-sand-50 shadow-[0_10px_24px_-14px_rgba(15,61,54,0.9)] hover:bg-ink-700 active:bg-ink-900',
  secondary:
    'bg-sand-100 text-ink-800 border border-sand-200 hover:bg-sand-200/80 active:bg-sand-200',
  outline:
    'border border-sand-300 bg-white/60 text-ink-700 hover:border-moss/50 hover:bg-white hover:text-pine',
  ghost: 'text-ink-600 hover:bg-sand-100 hover:text-ink-900',
  danger:
    'bg-[#9c3b2e] text-white hover:bg-[#833024] active:bg-[#6d271d]',
  dark: 'bg-ink-900 text-sand-50 hover:bg-ink-700',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 gap-1.5 rounded-xl px-3 text-[13px]',
  md: 'h-11 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-2xl px-6 text-[15px]',
  icon: 'h-10 w-10 rounded-full',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leading,
    trailing,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-all duration-200',
        'disabled:cursor-not-allowed disabled:opacity-55',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leading}
      {children}
      {!loading && trailing}
    </button>
  );
});
