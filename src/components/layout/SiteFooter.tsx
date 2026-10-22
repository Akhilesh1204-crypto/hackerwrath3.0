import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { LAUNCH_CITIES } from '@/lib/constants';

const columns = [
  {
    title: 'Explore',
    links: [
      { href: '/search', label: 'Find a home' },
      { href: '/#how-it-works', label: 'How swapping works' },
      { href: '/#swapscore', label: 'SwapScore' },
      { href: '/search?city=Mumbai', label: 'Mumbai' },
    ],
  },
  {
    title: 'Members',
    links: [
      { href: '/listings', label: 'List your home' },
      { href: '/bookings', label: 'Trips & stays' },
      { href: '/swaps', label: 'Direct swaps' },
      { href: '/wallet', label: 'Credit wallet' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { href: '/profile', label: 'Verification' },
      { href: '/#trust', label: 'Safety & privacy' },
      { href: '/bookings', label: 'Report an issue' },
      { href: '/#policy', label: 'Cancellation policy' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-sand-200/80 bg-[#f4efe4]/70">
      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[13px] leading-6 text-ink-600">
              A trusted network of homes across India&apos;s four launch cities. Swap directly with
              another member or stay with credits earned by hosting.
            </p>
            <p className="mt-4 text-[11px] leading-5 text-ink-500">
              Credits are internal units for eligible stays and have no cash value in the MVP.
              SwapStay does not guarantee savings or availability.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                {column.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-ink-700 transition hover:text-pine"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-sand-200/80 pt-6 text-[11px] text-ink-500">
          <span className="font-medium text-ink-600">Launch cities:</span>
          {LAUNCH_CITIES.map((city, index) => (
            <span key={city.name}>
              {city.name}
              {index < LAUNCH_CITIES.length - 1 && <span className="mx-1.5 text-sand-400">·</span>}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-col justify-between gap-2 text-[11px] text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} SwapStay. Pilot release.</p>
          <p>Design mobile-first · WCAG 2.2 AA principles · Built for HackerWrath 3.0</p>
        </div>
      </div>
    </footer>
  );
}
