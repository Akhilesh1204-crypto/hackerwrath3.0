'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Primitives';
import { PageHeader } from '@/components/layout/PageHeader';
import { CITIES } from '@/lib/constants';
import { formatRange, nightsBetween, todayISO } from '@/lib/dates';
import { searchProperties } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';

function SearchView() {
  const router = useRouter();
  const params = useSearchParams();
  const searchKey = params.toString();

  const [city, setCity] = useState(params.get('city') ?? '');
  const [checkIn, setCheckIn] = useState(params.get('checkIn') ?? '');
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? '');
  const [guests, setGuests] = useState(Number(params.get('guests') ?? 2));
  const [minScore, setMinScore] = useState(params.get('minScore') ?? '');
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    setCity(params.get('city') ?? '');
    setCheckIn(params.get('checkIn') ?? '');
    setCheckOut(params.get('checkOut') ?? '');
    setGuests(Number(params.get('guests') ?? 2));
    setMinScore(params.get('minScore') ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  const page = Math.max(1, Number(params.get('page') ?? 1));
  const activeCity = params.get('city') ?? '';
  const activeCheckIn = params.get('checkIn') ?? '';
  const activeCheckOut = params.get('checkOut') ?? '';

  const results = useApiQuery(
    () =>
      searchProperties({
        city: activeCity || undefined,
        checkIn: activeCheckIn || undefined,
        checkOut: activeCheckOut || undefined,
        guests: Number(params.get('guests') ?? 2) || undefined,
        minScore: params.get('minScore') ? Number(params.get('minScore')) : undefined,
        page,
        limit: 12,
      }),
    [searchKey],
  );

  const total = results.data?.meta?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / 12));
  const nights = activeCheckIn && activeCheckOut ? nightsBetween(activeCheckIn, activeCheckOut) : 0;
  const hasFilters = Boolean(
    activeCity || activeCheckIn || activeCheckOut || params.get('minScore') || params.get('guests'),
  );

  const summary = useMemo(() => {
    if (activeCheckIn && activeCheckOut) {
      return `${formatRange(activeCheckIn, activeCheckOut)} · ${nights} ${nights === 1 ? 'night' : 'nights'}`;
    }
    return 'Any dates · dates rechecked when you request';
  }, [activeCheckIn, activeCheckOut, nights]);

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    if (checkIn && !checkOut) {
      setDateError('Add a check-out date, or clear the check-in date.');
      return;
    }
    if (checkIn && checkOut && checkOut <= checkIn) {
      setDateError('Check-out must be after check-in.');
      return;
    }
    setDateError(null);
    const next = new URLSearchParams();
    if (city) next.set('city', city);
    if (checkIn) next.set('checkIn', checkIn);
    if (checkOut) next.set('checkOut', checkOut);
    if (guests) next.set('guests', String(guests));
    if (minScore) next.set('minScore', minScore);
    router.push(`/search${next.toString() ? `?${next.toString()}` : ''}`);
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(params.toString());
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    router.push(`/search?${next.toString()}`);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow="Explore homes"
        title={
          activeCity ? (
            <>Homes in {activeCity}</>
          ) : (
            <>Find a home worth <span className="italic text-moss">trading for</span></>
          )
        }
        description="Search verified members' homes across the launch cities. Availability, SwapScore and house rules are shown up front, and nothing is reserved until both sides agree."
        actions={
          hasFilters ? (
            <Button variant="ghost" size="sm" onClick={() => router.push('/search')} leading={<X className="h-4 w-4" />}>
              Clear filters
            </Button>
          ) : undefined
        }
      />

      <form
        onSubmit={applyFilters}
        className="mt-6 rounded-3xl border border-sand-200/90 bg-white/85 p-4 shadow-soft sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_0.8fr_0.9fr_auto]">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              <MapPin className="h-3 w-3" /> Destination
            </span>
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="h-11 w-full rounded-xl border border-sand-300 bg-white/90 px-3 text-[13px] text-ink-800 outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15"
            >
              <option value="">All launch cities</option>
              {CITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              <CalendarDays className="h-3 w-3" /> Check in
            </span>
            <input
              type="date"
              value={checkIn}
              min={todayISO()}
              onChange={(event) => setCheckIn(event.target.value)}
              className="h-11 w-full rounded-xl border border-sand-300 bg-white/90 px-3 text-[13px] text-ink-800 outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              <CalendarDays className="h-3 w-3" /> Check out
            </span>
            <input
              type="date"
              value={checkOut}
              min={checkIn || todayISO()}
              onChange={(event) => setCheckOut(event.target.value)}
              className="h-11 w-full rounded-xl border border-sand-300 bg-white/90 px-3 text-[13px] text-ink-800 outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              <Users className="h-3 w-3" /> Guests
            </span>
            <select
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value))}
              className="h-11 w-full rounded-xl border border-sand-300 bg-white/90 px-3 text-[13px] text-ink-800 outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? 'guest' : 'guests'}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              <SlidersHorizontal className="h-3 w-3" /> SwapScore
            </span>
            <select
              value={minScore}
              onChange={(event) => setMinScore(event.target.value)}
              className="h-11 w-full rounded-xl border border-sand-300 bg-white/90 px-3 text-[13px] text-ink-800 outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15"
            >
              <option value="">Any score</option>
              <option value="70">70+ · grade B or better</option>
              <option value="80">80+ · strong</option>
              <option value="85">85+ · grade A</option>
            </select>
          </label>

          <div className="flex items-end">
            <Button type="submit" className="h-11 w-full lg:w-auto" leading={<Search className="h-4 w-4" />}>
              Search
            </Button>
          </div>
        </div>
        {dateError && (
          <p className="mt-2 text-xs font-medium text-[#9c3b2e]" role="alert">
            {dateError}
          </p>
        )}
      </form>

      <div className="mt-8 flex flex-col justify-between gap-3 border-b border-sand-200/80 pb-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-[26px] leading-tight text-ink-900">
            {results.loading ? 'Looking for matches…' : `${total} ${total === 1 ? 'home' : 'homes'} found`}
          </h2>
          <p className="mt-1 text-[12px] text-ink-500">
            {summary}
            {activeCity ? ` · ${activeCity}` : ''}
          </p>
        </div>
        <p className="text-[11px] text-ink-500/90">
          Ranked by SwapScore, then closest capacity fit. No paid placement.
        </p>
      </div>

      {results.loading && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-3xl border border-sand-200 bg-white/60">
              <div className="skeleton aspect-[4/3] rounded-none" />
              <div className="space-y-3 p-5">
                <div className="skeleton h-4 w-4/5" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!results.loading && results.error && (
        <ErrorState
          className="mt-6"
          title="Search could not load"
          message={results.error}
          code={results.errorCode}
          onRetry={results.refresh}
        />
      )}

      {!results.loading && !results.error && results.data && results.data.items.length > 0 && (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.data.items.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="mt-10 flex items-center justify-between border-t border-sand-200/80 pt-5">
              <p className="text-[12px] text-ink-500">
                Page {page} of {pageCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  leading={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pageCount}
                  onClick={() => goToPage(page + 1)}
                  trailing={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {!results.loading && !results.error && results.data && results.data.items.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={<Compass className="h-5 w-5" />}
            title={hasFilters ? 'No homes match every filter yet' : 'No live homes yet'}
            description={
              hasFilters
                ? 'Try widening the dates, lowering the score threshold, or looking in another launch city. We would rather show an honest no-match than an unavailable home.'
                : 'Inventory is recruited and verified city by city. Try another destination, or list your own home to help the network grow.'
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {hasFilters && (
                  <Button variant="secondary" size="sm" onClick={() => router.push('/search')}>
                    Reset filters
                  </Button>
                )}
                {CITIES.slice(0, 3).map((option) => (
                  <Button
                    key={option}
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/search?city=${encodeURIComponent(option)}`)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Preparing search" className="py-24" />}>
      <SearchView />
    </Suspense>
  );
}
