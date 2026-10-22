import { describe, it, expect } from 'vitest';
import { calculateSwapScore } from '../src/lib/services/swapscore';

describe('SwapScore Engine', () => {
  it('calculates score for a top-tier property correctly (Grade A)', () => {
    const result = calculateSwapScore({
      condition: 90,
      location: 95,
      amenities: 85,
      space: 80,
      listingQuality: 90,
    });

    // 90*0.25 (22.5) + 95*0.25 (23.75) + 85*0.2 (17) + 80*0.15 (12) + 90*0.15 (13.5) = 88.75
    expect(result.totalScore).toBe(88.75);
    expect(result.grade).toBe('A');
  });

  it('assigns correct grade boundaries', () => {
    // Exactly 85 -> Grade A
    expect(calculateSwapScore({ condition: 85, location: 85, amenities: 85, space: 85, listingQuality: 85 }).grade).toBe('A');
    // 84.9 -> Grade B
    expect(calculateSwapScore({ condition: 84.9, location: 84.9, amenities: 84.9, space: 84.9, listingQuality: 84.9 }).grade).toBe('B');
    // 70 -> Grade B
    expect(calculateSwapScore({ condition: 70, location: 70, amenities: 70, space: 70, listingQuality: 70 }).grade).toBe('B');
    // 55 -> Grade C
    expect(calculateSwapScore({ condition: 55, location: 55, amenities: 55, space: 55, listingQuality: 55 }).grade).toBe('C');
    // 40 -> Grade D
    expect(calculateSwapScore({ condition: 40, location: 40, amenities: 40, space: 40, listingQuality: 40 }).grade).toBe('D');
    // 39.9 -> Grade E
    expect(calculateSwapScore({ condition: 39.9, location: 39.9, amenities: 39.9, space: 39.9, listingQuality: 39.9 }).grade).toBe('E');
  });

  it('clamps values between 0 and 100', () => {
    const result = calculateSwapScore({
      condition: 120,
      location: -10,
      amenities: 100,
      space: 100,
      listingQuality: 100,
    });

    expect(result.breakdown.condition).toBe(100);
    expect(result.breakdown.location).toBe(0);
  });
});
