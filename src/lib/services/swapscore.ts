export interface SwapScoreFactors {
  condition: number;        // 0-100
  location: number;         // 0-100
  amenities: number;        // 0-100
  space: number;            // 0-100
  listingQuality: number;   // 0-100
}

export type SwapScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface SwapScoreResult {
  totalScore: number;
  grade: SwapScoreGrade;
  breakdown: SwapScoreFactors;
  weights: {
    condition: number;
    location: number;
    amenities: number;
    space: number;
    listingQuality: number;
  };
  methodVersion: string;
}

export const SWAPSCORE_WEIGHTS = {
  condition: 0.25,
  location: 0.25,
  amenities: 0.20,
  space: 0.15,
  listingQuality: 0.15,
} as const;

export function calculateSwapScore(factors: SwapScoreFactors): SwapScoreResult {
  // Clamp all inputs between 0 and 100
  const condition = Math.max(0, Math.min(100, factors.condition));
  const location = Math.max(0, Math.min(100, factors.location));
  const amenities = Math.max(0, Math.min(100, factors.amenities));
  const space = Math.max(0, Math.min(100, factors.space));
  const listingQuality = Math.max(0, Math.min(100, factors.listingQuality));

  const total =
    condition * SWAPSCORE_WEIGHTS.condition +
    location * SWAPSCORE_WEIGHTS.location +
    amenities * SWAPSCORE_WEIGHTS.amenities +
    space * SWAPSCORE_WEIGHTS.space +
    listingQuality * SWAPSCORE_WEIGHTS.listingQuality;

  const totalScore = Math.round(total * 100) / 100;

  let grade: SwapScoreGrade = 'E';
  if (totalScore >= 85) {
    grade = 'A';
  } else if (totalScore >= 70) {
    grade = 'B';
  } else if (totalScore >= 55) {
    grade = 'C';
  } else if (totalScore >= 40) {
    grade = 'D';
  } else {
    grade = 'E';
  }

  return {
    totalScore,
    grade,
    breakdown: {
      condition,
      location,
      amenities,
      space,
      listingQuality,
    },
    weights: { ...SWAPSCORE_WEIGHTS },
    methodVersion: '1.0',
  };
}
