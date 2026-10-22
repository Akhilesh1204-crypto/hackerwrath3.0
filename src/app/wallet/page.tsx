'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Coins,
  Gift,
  Info,
  Lock,
  ReceiptText,
  Sparkles,
  Unlock,
  Wallet as WalletIcon,
} from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Primitives';
import { getTransactions, getWallet } from '@/lib/api';
import { CANCELLATION_POLICY, CREDIT_PER_NIGHT } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { useApiQuery } from '@/lib/hooks';
import type { CreditTransaction, CreditTxType, TxStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

const txMeta: Record<
  CreditTxType,
  { label: string; icon: typeof Coins; tone: string }
> = {
  initial_grant: { label: 'Starter allocation', icon: Gift, tone: 'bg-sage-100 text-pine' },
  reservation_hold: { label: 'Reservation hold', icon: Lock, tone: 'bg-[#fbf2dc] text-[#8a6420]' },
  reservation_release: { label: 'Hold released', icon: Unlock, tone: 'bg-sage-100 text-pine' },
  stay_debit: { label: 'Stay settled', icon: ReceiptText, tone: 'bg-[#f8e6e1] text-[#8d3527]' },
  host_reward: { label: 'Host reward', icon: Sparkles, tone: 'bg-sage-100 text-pine' },
  compensation_adjustment: { label: 'Adjustment', icon: Info, tone: 'bg-sand-100 text-ink-600' },
  swap_difference: { label: 'Unequal swap', icon: ArrowUpRight, tone: 'bg-[#fbf2dc] text-[#8a6420]' },
  cancellation_fee: { label: 'Cancellation fee', icon: Info, tone: 'bg-[#f8e6e1] text-[#8d3527]' },
};

const txStatusTone: Record<TxStatus, 'moss' | 'gold' | 'neutral'> = {
  posted: 'moss',
  pending: 'gold',
  voided: 'neutral',
};

function WalletContent() {
  const [page, setPage] = useState(1);
  const wallet = useApiQuery(() => getWallet(), []);
  const transactions = useApiQuery(() => getTransactions(page, PAGE_SIZE), [page]);

  useEffect(() => {
    const refresh = () => {
      wallet.refresh();
      transactions.refresh();
    };
    window.addEventListener('swapstay:wallet', refresh);
    return () => window.removeEventListener('swapstay:wallet', refresh);
  }, [wallet.refresh, transactions.refresh]);

  const summary = wallet.data;
  const items = transactions.data?.items ?? [];
  const total = transactions.data?.meta?.total ?? items.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow="Credits"
        title={
          <>
            Your swap <span className="italic text-moss">wallet</span>
          </>
        }
        description="Credits are a reciprocal booking allowance, not money. They cannot be bought, sold or cashed out. The server is the only authority on every balance."
        actions={
          <Link href="/search">
            <Button variant="secondary" leading={<Coins className="h-4 w-4" />}>
              Use credits
            </Button>
          </Link>
        }
      />

      {wallet.loading && <LoadingBlock label="Loading your wallet" className="py-20" />}

      {!wallet.loading && wallet.error && (
        <ErrorState
          className="mt-6"
          title="Wallet could not load"
          message={wallet.error}
          code={wallet.errorCode}
          onRetry={wallet.refresh}
        />
      )}

      {!wallet.loading && !wallet.error && summary && (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="relative overflow-hidden rounded-3xl bg-ink-900 p-6 text-sand-50 shadow-lift sm:p-8">
              <div
                className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-moss/30 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-24 right-12 h-52 w-52 rounded-full bg-gold-500/10 blur-3xl"
                aria-hidden
              />
              <div className="relative">
                <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-sand-50/60">
                  <WalletIcon className="h-3.5 w-3.5" /> Available to spend
                </p>
                <div className="mt-3 flex items-end gap-2.5">
                  <span className="font-display text-[64px] leading-[0.9] tracking-[-0.03em]">
                    {summary.available_balance}
                  </span>
                  <span className="pb-1.5 text-[12px] font-medium text-sand-50/60">
                    {summary.available_balance === 1 ? 'credit' : 'credits'}
                  </span>
                </div>
                <p className="mt-3 max-w-sm text-[11.5px] leading-6 text-sand-50/70">
                  One credit covers one night in a credit stay. {CREDIT_PER_NIGHT} night ={' '}
                  {CREDIT_PER_NIGHT} credit during the pilot.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href="/search">
                    <Button size="sm" className="bg-sand-50 text-ink-900 hover:bg-white" leading={<ArrowUpRight className="h-3.5 w-3.5" />}>
                      Find a stay
                    </Button>
                  </Link>
                  <Link href="/listings">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-sand-50 hover:bg-white/10"
                      leading={<ArrowDownLeft className="h-3.5 w-3.5" />}
                    >
                      Earn by hosting
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="card p-5">
                <p className="eyebrow">Reserved</p>
                <div className="mt-1.5 flex items-end gap-2">
                  <span className="font-display text-[32px] leading-none text-ink-900">
                    {summary.reserved_balance}
                  </span>
                  <span className="pb-0.5 text-[11px] text-ink-500">credits</span>
                </div>
                <p className="mt-2 text-[10.5px] leading-5 text-ink-500">
                  Held against pending or confirmed stays. Released if a booking is cancelled under policy.
                </p>
              </div>
              <div className="card p-5">
                <p className="eyebrow">Total balance</p>
                <div className="mt-1.5 flex items-end gap-2">
                  <span className="font-display text-[32px] leading-none text-ink-900">
                    {summary.total_balance}
                  </span>
                  <span className="pb-0.5 text-[11px] text-ink-500">credits</span>
                </div>
                <p className="mt-2 text-[10.5px] leading-5 text-ink-500">
                  Available + reserved. Figures come from posted ledger entries only.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-sand-200 bg-white/60 px-4 py-3 text-[11px] leading-5 text-ink-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
            Credits have no cash value and cannot be transferred between members. Any cash request in a
            swap or stay is a policy violation — report it.
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <section className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200/70 px-5 py-4">
                <div>
                  <h2 className="text-[18px] leading-tight">Transaction history</h2>
                  <p className="mt-0.5 text-[11px] text-ink-500">
                    Append-only ledger · {total} {total === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
                <Badge tone="outline">{PAGE_SIZE} per page</Badge>
              </div>

              {transactions.loading && <LoadingBlock label="Loading transactions" className="py-14" />}

              {!transactions.loading && transactions.error && (
                <div className="p-5">
                  <ErrorState
                    title="History could not load"
                    message={transactions.error}
                    code={transactions.errorCode}
                    onRetry={transactions.refresh}
                  />
                </div>
              )}

              {!transactions.loading && !transactions.error && items.length === 0 && (
                <div className="p-5">
                  <EmptyState
                    icon={<ReceiptText className="h-5 w-5" />}
                    title="No credit movements yet"
                    description="Your starter allocation and every hold, release and reward will appear here with a timestamp."
                    action={
                      <Link href="/listings">
                        <Button>List a home to earn</Button>
                      </Link>
                    }
                  />
                </div>
              )}

              {!transactions.loading && !transactions.error && items.length > 0 && (
                <>
                  <ul className="divide-y divide-sand-200/70">
                    {items.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))}
                  </ul>
                  <div className="flex items-center justify-between gap-3 border-t border-sand-200/70 px-5 py-3.5">
                    <p className="text-[10.5px] text-ink-500">
                      Page {page} of {pages}
                    </p>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={page <= 1}
                        onClick={() => setPage((value) => Math.max(1, value - 1))}
                        leading={<ChevronLeft className="h-3.5 w-3.5" />}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={page >= pages}
                        onClick={() => setPage((value) => Math.min(pages, value + 1))}
                        trailing={<ChevronRight className="h-3.5 w-3.5" />}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </section>

            <aside className="space-y-4">
              <div className="card p-5">
                <p className="eyebrow">How credits move</p>
                <ul className="mt-2.5 space-y-2.5 text-[11.5px] leading-5 text-ink-600">
                  <li className="flex gap-2">
                    <ArrowDownLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
                    <span>
                      <strong className="font-semibold text-ink-800">Earn:</strong> one credit per eligible
                      hosted night, posted when a stay is marked complete.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay-500" />
                    <span>
                      <strong className="font-semibold text-ink-800">Spend:</strong> one credit per night
                      requested. Credits are held immediately, settled on completion.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" />
                    <span>
                      <strong className="font-semibold text-ink-800">Hold:</strong> a pending request keeps
                      credits reserved, so they cannot be double-spent.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Unlock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
                    <span>
                      <strong className="font-semibold text-ink-800">Release:</strong> cancelling within
                      policy returns the hold to your available balance.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="card p-5">
                <p className="eyebrow">Cancellation policy</p>
                <ul className="mt-2.5 space-y-2 text-[11px] leading-5 text-ink-600">
                  {CANCELLATION_POLICY.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-clay-400" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[10.5px] leading-5 text-ink-500">
                  Final balances are always recalculated from the ledger by the server.
                </p>
              </div>

              <div className="rounded-2xl bg-sage-50 p-4 text-[11px] leading-5 text-pine">
                <p className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="h-3.5 w-3.5" /> A pilot rate, not a valuation
                </p>
                <p className="mt-1 text-pine/80">
                  The one-credit-per-night rate is a hypothesis being tested for fairness. It stays
                  configurable and is not a rupee price.
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: CreditTransaction }) {
  const meta = txMeta[transaction.transaction_type] ?? txMeta.compensation_adjustment;
  const Icon = meta.icon;
  const positive = transaction.amount > 0;
  const negative = transaction.amount < 0;

  return (
    <li className="flex items-start gap-3 px-5 py-3.5">
      <span className={cn('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl', meta.tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[12.5px] font-medium text-ink-900">{meta.label}</p>
          <Badge tone={txStatusTone[transaction.status]}>{transaction.status}</Badge>
        </div>
        <p className="mt-0.5 text-[11px] leading-5 text-ink-500">{transaction.description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-ink-500/80">
          <span>{formatDate(transaction.created_at.slice(0, 10))}</span>
          {transaction.booking_id && (
            <Link
              href="/bookings"
              className="font-medium text-pine underline decoration-moss/40 underline-offset-2"
            >
              View booking
            </Link>
          )}
        </div>
      </div>
      <span
        className={cn(
          'shrink-0 text-right font-display text-[18px] leading-none tabular-nums',
          positive && 'text-moss',
          negative && 'text-clay-600',
          !positive && !negative && 'text-ink-500',
        )}
      >
        {positive ? '+' : ''}
        {transaction.amount}
      </span>
    </li>
  );
}

export default function WalletPage() {
  return (
    <RequireAuth>
      <WalletContent />
    </RequireAuth>
  );
}
