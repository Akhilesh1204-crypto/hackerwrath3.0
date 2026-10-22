'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, MapPin, Search, Users } from 'lucide-react';
import { CITIES } from '@/lib/constants';
import { addDaysISO, todayISO } from '@/lib/dates';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  defaultCity?: string;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: number;
  className?: string;
  variant?: 'hero' | 'inline';
}

export function SearchBar({
  defaultCity = '',
  defaultCheckIn = '',
  defaultCheckOut = '',
  defaultGuests = 2,
  className,
  variant = 'hero',
}: SearchBarProps) {
  const router = useRouter();
  const today = todayISO();
  const [city, setCity] = useState(defaultCity);
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(defaultGuests);
  const [error, setError] = useState<string | null>(null);

  const minCheckOut = useMemo(() => (checkIn ? addDaysISO(checkIn, 1) : addDaysISO(today, 1)), [checkIn, today]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (checkIn && !checkOut) {
      setError('Add a check-out date, or clear check-in to search any dates.');
      return;
    }
    if (checkIn && checkOut && checkOut <= checkIn) {
      setError('Check-out must be after check-in.');
      return;
    }
    setError(null);

    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', String(guests));
    router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  }

  const shell =
    variant === 'hero'
      ? 'rounded-[1.6rem] border border-white/70 bg-white/95 p-2 shadow-lift backdrop-blur'
      : 'rounded-2xl border border-sand-200 bg-white/90 p-2 shadow-soft';

  return (
    <form onSubmit={submit} className={cn('w-full', className)} aria-label="Search homes">
      <div className={cn('grid gap-1.5 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto]', shell)}>
        <label className="group flex cursor-pointer flex-col justify-center rounded-xl px-3.5 py-2.5 transition hover:bg-sand-50">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            <MapPin className="h-3 w-3" /> Destination
          </span>
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="mt-0.5 w-full cursor-pointer appearance-none bg-transparent text-[13.5px] font-medium text-ink-900 outline-none"
            aria-label="Destination city"
          >
            <option value="">Any launch city</option>
            {CITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="group flex cursor-pointer flex-col justify-center rounded-xl px-3.5 py-2.5 transition hover:bg-sand-50">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            <CalendarDays className="h-3 w-3" /> Check in
          </span>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={(event) => {
              setCheckIn(event.target.value);
              if (checkOut && event.target.value && checkOut <= event.target.value) {
                setCheckOut(addDaysISO(event.target.value, 1));
              }
            }}
            className="mt-0.5 w-full bg-transparent text-[13.5px] font-medium text-ink-900 outline-none"
            aria-label="Check-in date"
          />
        </label>

        <label className="group flex cursor-pointer flex-col justify-center rounded-xl px-3.5 py-2.5 transition hover:bg-sand-50">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            <CalendarDays className="h-3 w-3" /> Check out
          </span>
          <input
            type="date"
            value={checkOut}
            min={minCheckOut}
            onChange={(event) => setCheckOut(event.target.value)}
            className="mt-0.5 w-full bg-transparent text-[13.5px] font-medium text-ink-900 outline-none"
            aria-label="Check-out date"
          />
        </label>

        <label className="group flex cursor-pointer flex-col justify-center rounded-xl px-3.5 py-2.5 transition hover:bg-sand-50">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            <Users className="h-3 w-3" /> Guests
          </span>
          <select
            value={guests}
            onChange={(event) => setGuests(Number(event.target.value))}
            className="mt-0.5 w-full cursor-pointer appearance-none bg-transparent text-[13.5px] font-medium text-ink-900 outline-none"
            aria-label="Number of guests"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? 'guest' : 'guests'}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-pine px-5 text-[13.5px] font-semibold text-sand-50 shadow-[0_12px_26px_-14px_rgba(15,61,54,0.9)] transition hover:bg-ink-700 sm:col-span-2 lg:col-span-1"
        >
          <Search className="h-4 w-4" />
          Search homes
        </button>
      </div>
      {error && (
        <p className="mt-2 pl-2 text-xs font-medium text-[#9c3b2e]" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
