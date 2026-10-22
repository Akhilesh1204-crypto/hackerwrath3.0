/**
 * Date utilities for night calculation and range expansion.
 * Following specification: check-in is inclusive, check-out is exclusive.
 * E.g., 2026-10-10 to 2026-10-12 represents 2 nights (10th and 11th).
 */

export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getNightDates(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const current = new Date(checkIn);
  const end = new Date(checkOut);

  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function areRangesOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  // [startA, endA) and [startB, endB) overlap if startA < endB and endA > startB
  return startA < endB && endA > startB;
}
