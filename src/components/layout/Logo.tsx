import Link from 'next/link';

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <span
      className={`relative inline-grid place-items-center overflow-hidden rounded-2xl bg-pine text-sand-50 shadow-[0_8px_18px_-12px_rgba(15,61,54,0.9)] ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" fill="none" className="h-[62%] w-[62%]">
        <path
          d="M6 17.2 16 8.8l10 8.4"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 16.4V24h5v-4.6h4V24h5v-7.6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-clay-400" />
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2.5 rounded-xl py-1 pr-2"
      aria-label="SwapStay home"
    >
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[22px] tracking-tight text-ink-900 transition group-hover:text-pine">
            SwapStay
          </span>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-500/70">
            Homes, exchanged
          </span>
        </span>
      )}
    </Link>
  );
}
