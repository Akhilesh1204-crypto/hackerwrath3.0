'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Info, Loader2, X } from 'lucide-react';
import { getAvailability, setAvailability } from '@/lib/api';
import { errorMessage } from '@/lib/api/client';
import { monthBounds, monthGrid, monthLabel, todayISO } from '@/lib/dates';
import { useApiQuery } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

type EditableStatus = 'available' | 'unavailable';

export function AvailabilityCalendar({ propertyId }: { propertyId: string }) {
  const { success, error: toastError } = useToast();
  const today = todayISO();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nonce, setNonce] = useState(0);
  const [saving, setSaving] = useState<EditableStatus | null>(null);

  const bounds = useMemo(() => monthBounds(year, month), [year, month]);
  const calendar = useApiQuery(
    () => getAvailability(propertyId, bounds.start, bounds.end),
    [propertyId, year, month, nonce],
  );

  useEffect(() => {
    setSelected(new Set());
  }, [year, month]);

  const statusByDate = useMemo(() => {
    const map = new Map<string, string>();
    (calendar.data ?? []).forEach((day) => map.set(day.date, day.availability_status));
    return map;
  }, [calendar.data]);

  const weeks = useMemo(() => monthGrid(year, month), [year, month]);

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  function toggle(date: string) {
    if (date < today) return;
    const status = statusByDate.get(date);
    if (status === 'booked' || status === 'reserved') return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  async function apply(status: EditableStatus) {
    if (selected.size === 0) return;
    setSaving(status);
    try {
      await setAvailability(
        propertyId,
        Array.from(selected)
          .sort()
          .map((date) => ({ date, status })),
      );
      success(
        status === 'available' ? 'Dates opened' : 'Dates closed',
        `${selected.size} ${selected.size === 1 ? 'night' : 'nights'} updated. Confirmed bookings still override the calendar.`,
      );
      setSelected(new Set());
      setNonce((value) => value + 1);
    } catch (error) {
      toastError('Calendar not updated', errorMessage(error));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sage-100 text-pine">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[18px] leading-tight">Availability</h2>
              <p className="text-[11.5px] text-ink-500">
                Tap dates to select, then open or close them in one go.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-sand-200 bg-white/70 p-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-600 transition hover:bg-sand-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[128px] text-center text-[12px] font-semibold text-ink-800">
            {monthLabel(year, month)}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-600 transition hover:bg-sand-100"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {calendar.loading ? (
        <div className="grid place-items-center py-20 text-ink-500">
          <Loader2 className="h-6 w-6 animate-spin text-moss" />
          <p className="mt-2 text-[11.5px]">Loading calendar…</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span
                key={day}
                className="pb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-500"
              >
                {day}
              </span>
            ))}
            {weeks.flat().map((date, index) => {
              if (!date) return <span key={`blank-${index}`} className="h-10" />;
              const status = statusByDate.get(date);
              const isPast = date < today;
              const locked = status === 'booked' || status === 'reserved';
              const isSelected = selected.has(date);
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => toggle(date)}
                  disabled={isPast || locked}
                  aria-pressed={isSelected}
                  aria-label={`${date}${status ? `, ${status}` : ', not published'}${
                    isSelected ? ', selected' : ''
                  }`}
                  className={cn(
                    'relative grid h-10 place-items-center rounded-xl border text-[12px] font-medium tabular-nums transition',
                    isPast
                      ? 'cursor-not-allowed border-transparent text-ink-500/25'
                      : 'border-sand-200 bg-white/70 text-ink-700 hover:border-moss/40',
                    status === 'available' && !isSelected && 'border-sage-200 bg-sage-100 text-pine',
                    status === 'unavailable' && !isSelected && 'border-[#e5cbc4] bg-[#fdf4f2] text-[#8d3527]',
                    locked && 'cursor-not-allowed border-ink-700 bg-ink-900 text-sand-50 opacity-90',
                    isSelected && 'border-pine bg-pine text-sand-50 shadow-sm',
                  )}
                >
                  {Number(date.slice(8))}
                  {locked && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-sand-50/80" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>

          {calendar.error && (
            <p className="mt-3 rounded-xl border border-[#e3bdb4] bg-[#fdf4f2] px-3 py-2 text-[11.5px] text-[#8d3527]">
              {calendar.error}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10.5px] text-ink-500">
            <Legend className="bg-sage-100 ring-1 ring-sage-200" label="Available" />
            <Legend className="bg-[#fdf4f2] ring-1 ring-[#e5cbc4]" label="Unavailable" />
            <Legend className="bg-ink-900" label="Booked / reserved" />
            <Legend className="bg-white ring-1 ring-sand-200" label="Not published" />
            <Legend className="bg-pine" label="Selected" />
          </div>

          <div className="mt-5 flex flex-col gap-2 border-t border-sand-200/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-ink-500">
              {selected.size === 0
                ? 'No dates selected.'
                : `${selected.size} ${selected.size === 1 ? 'night' : 'nights'} selected.`}
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(new Set())}
                  leading={<X className="h-3.5 w-3.5" />}
                  disabled={Boolean(saving)}
                >
                  Clear
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => apply('unavailable')}
                loading={saving === 'unavailable'}
                disabled={selected.size === 0 || Boolean(saving)}
              >
                Mark unavailable
              </Button>
              <Button
                size="sm"
                onClick={() => apply('available')}
                loading={saving === 'available'}
                disabled={selected.size === 0 || Boolean(saving)}
                leading={<Check className="h-3.5 w-3.5" />}
              >
                Mark available
              </Button>
            </div>
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-5 text-ink-500">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Past dates and booked or reserved nights cannot be edited here. The server still rechecks
            confirmed bookings and overlapping requests at the moment of booking.
          </p>
        </>
      )}
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2.5 w-2.5 rounded-full', className)} aria-hidden />
      {label}
    </span>
  );
}
