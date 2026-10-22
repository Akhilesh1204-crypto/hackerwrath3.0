'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import type { SwapScoreGrade } from '@/lib/types';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-moss', className)} aria-hidden />;
}

export function LoadingBlock({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-10 text-sm text-ink-500', className)}>
      <Spinner className="h-4 w-4" />
      <span>{label}…</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-sand-300 bg-white/50 px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 text-pine">
          {icon}
        </div>
      )}
      <h3 className="text-lg">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm leading-6 text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'We could not load this',
  message,
  onRetry,
  code,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  code?: string | null;
  className?: string;
}) {
  const backendIssue = code === 'NETWORK_ERROR' || code === 'BACKEND_UNAVAILABLE';

  return (
    <div
      className={cn(
        'rounded-3xl border border-[#e3c9c3] bg-[#fdf6f4] px-6 py-8 text-center',
        className,
      )}
    >
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-[#f7e6e1] text-[#a8402f]">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="text-lg text-ink-900">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-lg text-sm leading-6 text-ink-600">{message}</p>
      {backendIssue && (
        <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-ink-500">
          Set <code className="rounded bg-white/70 px-1 py-0.5">BACKEND_URL</code> in{' '}
          <code className="rounded bg-white/70 px-1 py-0.5">.env.local</code> or start the demo from the
          sign-in page.
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-ink-800 shadow-sm ring-1 ring-inset ring-sand-300 transition hover:bg-sand-50"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        )}
        {backendIssue && (
          <Link
            href="/login"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-pine transition hover:bg-white/70"
          >
            Open demo mode <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
  ariaLabel,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex gap-1 overflow-x-auto border-b border-sand-200/80 no-scrollbar', className)}
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative shrink-0 px-3.5 py-3 text-[13px] font-medium transition',
              selected ? 'text-pine' : 'text-ink-500 hover:text-ink-800',
            )}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                    selected ? 'bg-sage-100 text-pine' : 'bg-sand-200/80 text-ink-500',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {selected && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-pine" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}

const avatarPalettes = [
  'from-[#1f6f5c] to-[#8fb9a0]',
  'from-[#a5572a] to-[#e0a87f]',
  'from-[#3f6f86] to-[#a8c9d6]',
  'from-[#655a83] to-[#b8aecf]',
  'from-[#8b5570] to-[#d5aebd]',
  'from-[#557a63] to-[#bcd4c4]',
];

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const index = (name ?? 'S').charCodeAt(0) % avatarPalettes.length;
  const sizes = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-14 w-14 text-base',
  };
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold tracking-wide text-white shadow-inner',
        avatarPalettes[index],
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

const gradeColor: Record<SwapScoreGrade, string> = {
  A: '#1f6f5c',
  B: '#4f8a6f',
  C: '#c9963f',
  D: '#c2703d',
  E: '#a8402f',
};

export function ScoreRing({
  score,
  grade,
  size = 64,
  showGrade = true,
}: {
  score?: number | null;
  grade?: SwapScoreGrade | null;
  size?: number;
  showGrade?: boolean;
}) {
  if (score === undefined || score === null) {
    return (
      <div
        className="grid place-items-center rounded-full border border-dashed border-sand-300 text-[10px] font-medium uppercase tracking-wider text-ink-500/70"
        style={{ width: size, height: size }}
      >
        No score
      </div>
    );
  }
  const clamped = Math.max(0, Math.min(100, score));
  const color = grade ? gradeColor[grade] : gradeColor.B;
  const inner = Math.round(size * 0.78);
  return (
    <div
      className="relative grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${clamped * 3.6}deg, #ece2d1 0deg)`,
      }}
      title={`SwapScore ${clamped.toFixed(2)} out of 100`}
    >
      <div
        className="grid place-items-center rounded-full bg-white text-ink-900"
        style={{ width: inner, height: inner }}
      >
        <span
          className="font-display leading-none"
          style={{ fontSize: Math.round(size * 0.28) }}
        >
          {clamped.toFixed(clamped % 1 === 0 ? 0 : 1)}
        </span>
        {showGrade && grade && (
          <span className="mt-0.5 text-[9px] font-semibold tracking-[0.12em]" style={{ color }}>
            {grade}
          </span>
        )}
      </div>
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-[13px] text-ink-500">{label}</dt>
      <dd className="text-right text-[13px] font-medium text-ink-800">{value}</dd>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-2">{children}</p>;
}
