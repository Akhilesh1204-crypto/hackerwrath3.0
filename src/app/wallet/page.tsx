'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CreditTransaction } from '@/types/database';
import { Wallet, Sparkles, Shield, ArrowDownLeft, ArrowUpRight, Lock, CheckCircle2, Info } from 'lucide-react';

export default function WalletPage() {
  const { currentUser, refreshWallet } = useAuth();
  const [wallet, setWallet] = useState<{ available_balance: number; reserved_balance: number; total_balance: number } | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWalletData() {
      if (!currentUser) return;
      setLoading(true);
      try {
        // 1. Fetch balance
        const balRes = await fetch('/api/wallet', {
          headers: { 'x-user-id': currentUser.id },
        });
        const balData = await balRes.json();
        if (balData.success) {
          setWallet(balData.data);
        }

        // 2. Fetch ledger transactions
        const txRes = await fetch('/api/wallet/transactions', {
          headers: { 'x-user-id': currentUser.id },
        });
        const txData = await txRes.json();
        if (txData.success) {
          setTransactions(txData.data || []);
        }
      } catch (err) {
        console.error('Error fetching wallet:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWalletData();
  }, [currentUser]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* HEADER */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          Server-Authoritative Append-Only Ledger
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          SwapStay Credit Wallet
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Earn credits by hosting verified guests; spend credits on accommodations in Mumbai, Bengaluru, Delhi NCR, and Hyderabad.
        </p>
      </div>

      {/* BALANCE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* AVAILABLE */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Available Credits
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {wallet?.available_balance ?? currentUser?.available_balance ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Ready to spend immediately on any eligible booking.
          </p>
        </div>

        {/* RESERVED */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Reserved Credits
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {wallet?.reserved_balance ?? currentUser?.reserved_balance ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Held in escrow for pending requested or confirmed stays.
          </p>
        </div>

        {/* TOTAL */}
        <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Account Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tight">
            {wallet?.total_balance ?? (currentUser ? currentUser.available_balance + currentUser.reserved_balance : 0)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Available + Reserved. No cash redemption in MVP.
          </p>
        </div>
      </div>

      {/* PILOT RULES EXPLANATION BANNER */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <strong>Four-City Pilot Valuation Rule:</strong> 1 credit earned per hosted night; 1 credit spent per booked night. Credits are internal non-cash accounting units managed strictly on the server with double-spending locks.
        </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            Append-Only Transaction Ledger
          </h2>
          <span className="text-xs text-slate-500">
            Showing {transactions.length} recorded events
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Fetching ledger history from Supabase...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No transactions recorded yet on this account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6">Event Type</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px]">
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-6 font-black text-sm">
                        <span className={`inline-flex items-center gap-1 ${
                          isPositive ? 'text-emerald-600' : 'text-slate-700'
                        }`}>
                          {isPositive ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          {isPositive ? `+${tx.amount}` : tx.amount} Credits
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase text-[10px]">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-400 font-mono text-[11px]">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
