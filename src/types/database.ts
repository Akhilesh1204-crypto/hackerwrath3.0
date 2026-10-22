export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type UserRole = 'member' | 'admin';
export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'suspended' | 'inactive';
export type AvailabilityStatus = 'available' | 'unavailable' | 'reserved' | 'booked';
export type SwapRequestStatus = 'pending' | 'requester_accepted' | 'recipient_accepted' | 'confirmed' | 'declined' | 'cancelled';
export type BookingStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';
export type BookingType = 'direct_swap' | 'credit_stay';
export type CreditTxType = 
  | 'initial_grant'
  | 'reservation_hold'
  | 'reservation_release'
  | 'stay_debit'
  | 'host_reward'
  | 'compensation_adjustment'
  | 'swap_difference'
  | 'cancellation_fee';
export type TxStatus = 'pending' | 'posted' | 'voided';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export type LaunchCity = 'Mumbai' | 'Bengaluru' | 'Delhi' | 'Gurugram' | 'Noida' | 'Hyderabad';

export interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
  phone: string | null;
  verification_status: VerificationStatus;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  city: LaunchCity | string;
  state: string;
  neighbourhood: string;
  property_type: string;
  bedrooms: number;
  guest_capacity: number;
  amenities: string[];
  house_rules: string[];
  listing_status: ListingStatus;
  exact_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyPhoto {
  id: string;
  property_id: string;
  storage_path: string;
  display_order: number;
  moderation_status: ModerationStatus;
  created_at: string;
}

export interface AvailabilityCalendar {
  id: string;
  property_id: string;
  date: string; // YYYY-MM-DD
  availability_status: AvailabilityStatus;
  created_at: string;
  updated_at: string;
}

export interface PropertyScore {
  id: string;
  property_id: string;
  condition_score: number;
  location_score: number;
  amenities_score: number;
  space_score: number;
  listing_quality_score: number;
  total_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  method_version: string;
  evidence_status: string;
  assessed_at: string;
  assessed_by: string | null;
}

export interface SwapRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  requester_property_id: string;
  recipient_property_id: string;
  requester_check_in: string; // YYYY-MM-DD
  requester_check_out: string;
  recipient_check_in: string;
  recipient_check_out: string;
  request_status: SwapRequestStatus;
  requester_accepted_at: string | null;
  recipient_accepted_at: string | null;
  created_at: string;
  updated_at: string;
  credit_difference: number;
  credit_payer_id: string | null;
  credit_recipient_id: string | null;
  credit_terms_note: string | null;
  credit_terms_status: 'equal' | 'pending' | 'accepted' | 'countered' | 'declined' | 'return_stay';
}

export interface SwapAgreement {
  id: string;
  swap_request_id: string;
  agreement_version: string;
  terms_snapshot: Record<string, unknown>;
  requester_accepted_at: string;
  recipient_accepted_at: string;
  confirmed_at: string;
  created_at: string;
}

export interface Booking {
  id: string;
  property_id: string;
  guest_id: string;
  host_id: string;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  booking_status: BookingStatus;
  booking_type: BookingType;
  credit_price: number;
  swap_request_id: string | null;
  created_at: string;
  updated_at: string;
  credit_reservation_amount: number;
  cancellation_fee_nights: number;
  credits_settled_at: string | null;
  credits_released_at: string | null;
}

export interface CreditAccount {
  user_id: string;
  available_balance: number;
  reserved_balance: number;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  booking_id: string | null;
  transaction_type: CreditTxType;
  amount: number;
  status: TxStatus;
  idempotency_key: string | null;
  description: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string;
  moderation_status: ModerationStatus;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'property' | 'booking' | 'user';
  target_id: string;
  category: 'safety' | 'cleanliness' | 'fraud' | 'misrepresentation' | 'other';
  description: string;
  evidence_urls: string[];
  status: ReportStatus;
  resolution_notes: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}
