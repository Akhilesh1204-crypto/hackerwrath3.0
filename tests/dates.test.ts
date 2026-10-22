import { describe, it, expect } from 'vitest';
import { calculateNights, getNightDates, areRangesOverlapping } from '../src/lib/services/dates';

describe('Date Service', () => {
  it('calculates nights correctly with inclusive check-in and exclusive check-out', () => {
    // 10 Oct to 12 Oct is 2 nights
    expect(calculateNights('2026-10-10', '2026-10-12')).toBe(2);
    // 1 night
    expect(calculateNights('2026-10-10', '2026-10-11')).toBe(1);
    // 0 nights
    expect(calculateNights('2026-10-10', '2026-10-10')).toBe(0);
  });

  it('generates the exact sequence of stay nights', () => {
    const nights = getNightDates('2026-10-10', '2026-10-13');
    expect(nights).toEqual(['2026-10-10', '2026-10-11', '2026-10-12']);
  });

  it('correctly detects overlapping date ranges', () => {
    // [10, 15) and [12, 17) -> Overlap
    expect(areRangesOverlapping('2026-10-10', '2026-10-15', '2026-10-12', '2026-10-17')).toBe(true);
    // [10, 12) and [12, 15) -> No overlap (checkout day can be next guest's check-in day)
    expect(areRangesOverlapping('2026-10-10', '2026-10-12', '2026-10-12', '2026-10-15')).toBe(false);
    // [10, 12) and [15, 18) -> No overlap
    expect(areRangesOverlapping('2026-10-10', '2026-10-12', '2026-10-15', '2026-10-18')).toBe(false);
  });
});
