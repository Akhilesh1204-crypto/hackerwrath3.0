import type { ScoreBreakdown, SwapScoreGrade } from '@/lib/types';

export const SWAPSCORE_WEIGHTS = {
  condition: 0.25,
  location: 0.25,
  amenities: 0.2,
  space: 0.15,
  listing_quality: 0.15,
} as const;

export function gradeForScore(total: number): SwapScoreGrade {
  if (total >= 85) return 'A';
  if (total >= 70) return 'B';
  if (total >= 55) return 'C';
  if (total >= 40) return 'D';
  return 'E';
}

export function calculateSwapScore(breakdown: ScoreBreakdown): {
  total: number;
  grade: SwapScoreGrade;
} {
  const clamp = (value: number) => Math.max(0, Math.min(100, value));
  const total =
    clamp(breakdown.condition) * SWAPSCORE_WEIGHTS.condition +
    clamp(breakdown.location) * SWAPSCORE_WEIGHTS.location +
    clamp(breakdown.amenities) * SWAPSCORE_WEIGHTS.amenities +
    clamp(breakdown.space) * SWAPSCORE_WEIGHTS.space +
    clamp(breakdown.listing_quality) * SWAPSCORE_WEIGHTS.listing_quality;
  const rounded = Math.round(total * 100) / 100;
  return { total: rounded, grade: gradeForScore(rounded) };
}
