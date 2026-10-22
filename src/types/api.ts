export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INSUFFICIENT_CREDITS'
  | 'DATES_UNAVAILABLE'
  | 'OVERLAPPING_BOOKING'
  | 'INVALID_STATE_TRANSITION'
  | 'MUTUAL_CONSENT_REQUIRED'
  | 'SELF_BOOKING_NOT_ALLOWED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ApiResponseError {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export interface SearchPropertiesQuery {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minScore?: number;
  page?: number;
  limit?: number;
}

export interface PropertySearchResultItem {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  neighbourhood: string;
  property_type: string;
  bedrooms: number;
  guest_capacity: number;
  amenities: string[];
  house_rules: string[];
  listing_status: string;
  score?: {
    total_score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'E';
    breakdown: {
      condition: number;
      location: number;
      amenities: number;
      space: number;
      listing_quality: number;
    };
  };
  photos: string[];
}

export interface WalletSummaryResponse {
  available_balance: number;
  reserved_balance: number;
  total_balance: number;
}
