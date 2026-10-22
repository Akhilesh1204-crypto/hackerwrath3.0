const DAY_MS = 86_400_000;

/** Parse a YYYY-MM-DD string as a local-calendar date (no timezone drift). */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Nights between an inclusive check-in and exclusive check-out. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = parseISODate(checkIn).getTime();
  const end = parseISODate(checkOut).getTime();
  return Math.max(0, Math.round((end - start) / DAY_MS));
}

/** Every night occupied by a stay (check-in .. night before check-out). */
export function eachNight(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  const total = nightsBetween(checkIn, checkOut);
  for (let index = 0; index < total; index += 1) {
    nights.push(addDaysISO(checkIn, index));
  }
  return nights;
}

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '—';
  return parseISODate(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function formatDateShort(iso: string): string {
  return formatDate(iso, { year: undefined });
}

export function formatRange(start: string, end: string): string {
  if (!start || !end) return '—';
  const startDate = parseISODate(start);
  const endDate = parseISODate(end);
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  return `${startDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })} – ${endDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

export function isPast(iso: string): boolean {
  return iso < todayISO();
}

export function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

/** Six-week grid (Sunday-first) covering the given month. */
export function monthGrid(year: number, monthIndex: number): (string | null)[][] {
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leading = first.getDay();
  const cells: (string | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toISODate(new Date(year, monthIndex, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function nightsLabel(nights: number): string {
  return `${nights} ${nights === 1 ? 'night' : 'nights'}`;
}

/** First and last day of the month containing `iso`. */
export function monthBounds(year: number, monthIndex: number): { start: string; end: string } {
  return {
    start: toISODate(new Date(year, monthIndex, 1)),
    end: toISODate(new Date(year, monthIndex + 1, 0)),
  };
}

export function relativeTime(iso: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso.slice(0, 10));
}
