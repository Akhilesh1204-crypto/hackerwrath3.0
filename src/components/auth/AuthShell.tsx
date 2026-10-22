import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, Coins, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { PropertyImage } from '@/components/property/PropertyImage';

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_0.92fr]">
      <div className="flex flex-col px-5 py-5 sm:px-10 sm:py-7">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-ink-500 transition hover:bg-sand-100 hover:text-ink-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px] animate-fade-up">
            {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
            <h1 className="text-[2.2rem] leading-[1.1] tracking-[-0.02em]">{title}</h1>
            {description && (
              <p className="mt-3 text-[13.5px] leading-6 text-ink-500">{description}</p>
            )}
            <div className="mt-7">{children}</div>
          </div>
        </div>

        <p className="text-center text-[10.5px] text-ink-500/80">
          Pilot release · Credits have no cash value ·{' '}
          <Link href="/#trust" className="link-underline">
            Trust & safety
          </Link>
        </p>
      </div>

      <aside className="relative hidden overflow-hidden lg:block">
        <PropertyImage
          photos={['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80']}
          city="Delhi"
          title="A SwapStay home"
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900/85 via-pine/60 to-ink-900/75" />
        <div className="relative flex h-full flex-col justify-between p-10 text-sand-50">
          <div className="flex items-center gap-2 text-[11px] font-medium text-sand-100/80">
            <Sparkles className="h-3.5 w-3.5 text-gold-300" />
            Four-city pilot · Mumbai · Bengaluru · Delhi NCR · Hyderabad
          </div>

          <div className="max-w-md">
            <svg viewBox="0 0 40 30" className="mb-4 h-8 w-10 text-sand-100/40" fill="currentColor" aria-hidden>
              <path d="M0 30V16C0 7.2 5 1.6 14 0l2 5c-5 1.4-8 4.8-8 9h8v16H0Zm22 0V16c0-8.8 5-14.4 14-16l2 5c-5 1.4-8 4.8-8 9h8v16H22Z" />
            </svg>
            <p className="font-display text-[26px] leading-[1.35] text-sand-50">
              I hosted for three nights in Koramangala and spent the credits on a week in Hyderabad.
              Everything I needed to decide was on the page.
            </p>
            <p className="mt-4 text-[12px] font-medium text-sand-100/70">
              Priya N. · Host since 2025 · Bengaluru
            </p>
          </div>

          <div className="grid max-w-md gap-3">
            {[
              { icon: BadgeCheck, label: 'Identity and hosting authority verified' },
              { icon: ShieldCheck, label: 'Mutual consent before any swap is confirmed' },
              { icon: Coins, label: 'One credit per eligible night in the pilot' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-[11.5px] text-sand-100/85 backdrop-blur-sm"
              >
                <item.icon className="h-4 w-4 text-sage-300" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
