'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  ChevronDown,
  Coins,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Repeat2,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getWallet } from '@/lib/api';
import type { WalletSummary } from '@/lib/types';
import { cn, initials } from '@/lib/utils';
import { Logo } from '@/components/layout/Logo';

const memberNav = [
  { href: '/search', label: 'Explore' },
  { href: '/listings', label: 'My homes' },
  { href: '/swaps', label: 'Swaps' },
  { href: '/messages', label: 'Messages' },
  { href: '/bookings', label: 'Trips' },
  { href: '/wallet', label: 'Wallet' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { status, profile, isDemo, isAdmin, signOut } = useAuth();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const authenticated = status === 'authenticated';

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!authenticated) {
      setWallet(null);
      return;
    }
    let alive = true;
    const load = () => {
      getWallet()
        .then((next) => {
          if (alive) setWallet(next);
        })
        .catch(() => {
          if (alive) setWallet(null);
        });
    };
    load();
    window.addEventListener('swapstay:wallet', load);
    return () => {
      alive = false;
      window.removeEventListener('swapstay:wallet', load);
    };
  }, [authenticated, pathname, profile?.id]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navItems = authenticated
    ? memberNav
    : [
        { href: '/search', label: 'Explore' },
        { href: '/#how-it-works', label: 'How it works' },
        { href: '/#swapscore', label: 'SwapScore' },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-sand-200/70 bg-sand-50/85 backdrop-blur-xl">
      <div className="container-page flex h-[70px] items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {navItems.map((item) => {
              const active =
                item.href === pathname ||
                (item.href === '/listings' &&
                  (pathname.startsWith('/listings') || pathname === '/properties/new')) ||
                (item.href !== '/' &&
                  item.href !== '/listings' &&
                  pathname.startsWith(item.href.split('#')[0]) &&
                  item.href !== '/#how-it-works' &&
                  item.href !== '/#swapscore');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-[13px] font-medium transition',
                    active ? 'bg-white text-pine shadow-sm' : 'text-ink-600 hover:bg-white/70 hover:text-ink-900',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {authenticated && wallet && (
            <Link
              href="/wallet"
              className="hidden items-center gap-2 rounded-full border border-sand-300/80 bg-white/80 px-3 py-1.5 text-[12px] font-medium text-ink-700 transition hover:border-moss/40 hover:text-pine sm:inline-flex"
              title="Available credits"
            >
              <Coins className="h-3.5 w-3.5 text-gold-500" />
              <span className="tabular-nums">{wallet.available_balance}</span>
              <span className="text-ink-500/70">credits</span>
            </Link>
          )}

          {authenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-sand-300/80 bg-white/80 py-1 pl-1 pr-2.5 transition hover:border-moss/40"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-pine to-moss text-[11px] font-semibold text-white">
                  {initials(profile?.display_name)}
                </span>
                <span className="hidden max-w-[110px] truncate text-[13px] font-medium text-ink-800 sm:block">
                  {profile?.display_name?.split(' ')[0] ?? 'Member'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-ink-500/70" />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-lift animate-fade-up"
                >
                  <div className="border-b border-sand-200/70 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {profile?.display_name ?? 'SwapStay member'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-500">
                      {isDemo ? 'Demo account · admin access' : profile?.verification_status === 'verified' ? 'Verified member' : 'Member'}
                    </p>
                  </div>
                  <div className="p-1.5">
                    {[
                      { href: '/profile', label: 'Profile & verification', icon: UserRound },
                      { href: '/listings', label: 'My homes', icon: Home },
                      { href: '/bookings', label: 'Trips & stays', icon: LayoutDashboard },
                      { href: '/wallet', label: 'Credits wallet', icon: Wallet },
                      ...(isAdmin ? [{ href: '/admin', label: 'Admin console', icon: ShieldCheck }] : []),
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-ink-700 transition hover:bg-sand-100"
                      >
                        <item.icon className="h-4 w-4 text-ink-500/80" />
                        {item.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void signOut()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-[#9c3b2e] transition hover:bg-[#fbf0ed]"
                    >
                      <LogOut className="h-4 w-4" />
                      {isDemo ? 'Exit demo' : 'Sign out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-xl px-3 py-2 text-[13px] font-medium text-ink-700 transition hover:bg-white/70 hover:text-ink-900 sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-pine px-4 text-[13px] font-medium text-sand-50 shadow-[0_10px_24px_-14px_rgba(15,61,54,0.9)] transition hover:bg-ink-700"
              >
                Join SwapStay
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-sand-300/80 bg-white/70 text-ink-700 lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-sand-200/70 bg-sand-50/95 px-5 pb-5 pt-2 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between border-b border-sand-200/60 py-3 text-sm font-medium text-ink-700"
              >
                {item.label}
                <ArrowUpRight className="h-3.5 w-3.5 text-ink-500/60" />
              </Link>
            ))}
            {authenticated && isAdmin && (
              <Link href="/admin" className="flex items-center justify-between border-b border-sand-200/60 py-3 text-sm font-medium text-ink-700">
                Admin console <ShieldCheck className="h-4 w-4 text-ink-500/60" />
              </Link>
            )}
            {!authenticated && (
              <Link href="/login" className="mt-3 rounded-xl border border-sand-300 px-4 py-2.5 text-center text-sm font-medium text-ink-800">
                Sign in
              </Link>
            )}
            {authenticated && (
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-sand-300 px-4 py-2.5 text-sm font-medium text-[#9c3b2e]"
              >
                <LogOut className="h-4 w-4" /> {isDemo ? 'Exit demo' : 'Sign out'}
              </button>
            )}
          </nav>
          {authenticated && wallet && (
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-ink-600">
                <Coins className="h-4 w-4 text-gold-500" /> Credits
              </span>
              <span className="font-semibold tabular-nums text-ink-900">
                {wallet.available_balance} available · {wallet.reserved_balance} reserved
              </span>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-500">
            <Repeat2 className="h-3.5 w-3.5" /> Swap directly or stay with credits.
          </div>
        </div>
      )}
    </header>
  );
}
