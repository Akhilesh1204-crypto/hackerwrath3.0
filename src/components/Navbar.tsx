'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, DEMO_USERS } from '@/context/AuthContext';
import { Home, Search, RefreshCw, Wallet, User, PlusCircle, ShieldAlert, Sparkles } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, switchUser } = useAuth();

  const navLinks = [
    { label: 'Explore Homes', href: '/', icon: Search },
    { label: 'List Home', href: '/properties/new', icon: PlusCircle },
    { label: 'My Swaps & Stays', href: '/swaps', icon: RefreshCw },
    { label: 'Credit Wallet', href: '/wallet', icon: Wallet },
    { label: 'Profile & Verification', href: '/profile', icon: User },
    ...(currentUser?.role === 'admin'
      ? [{ label: 'Admin Moderation', href: '/admin', icon: ShieldAlert }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                SS
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  SwapStay
                </span>
                <span className="hidden sm:inline-block ml-2 text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  4-City India MVP
                </span>
              </div>
            </Link>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* USER & WALLET BADGE */}
          <div className="flex items-center gap-3">
            {/* Live Wallet Badge */}
            {currentUser && (
              <Link
                href="/wallet"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
                title="Current available credits"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentUser.available_balance} Credits</span>
              </Link>
            )}

            {/* Demo User Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 px-1 hidden lg:inline">Actor:</span>
              <select
                value={currentUser?.id}
                onChange={(e) => switchUser(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer py-1 pr-2"
              >
                {DEMO_USERS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name} ({u.role === 'admin' ? 'Admin' : u.email.split('@')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
