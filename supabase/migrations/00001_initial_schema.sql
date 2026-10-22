-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ENUMS
CREATE TYPE verification_status_enum AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE user_role_enum AS ENUM ('member', 'admin');
CREATE TYPE listing_status_enum AS ENUM ('draft', 'pending_review', 'active', 'suspended', 'inactive');
CREATE TYPE availability_status_enum AS ENUM ('available', 'unavailable', 'reserved', 'booked');
CREATE TYPE swap_request_status_enum AS ENUM ('pending', 'requester_accepted', 'recipient_accepted', 'confirmed', 'declined', 'cancelled');
CREATE TYPE booking_status_enum AS ENUM ('requested', 'confirmed', 'completed', 'cancelled');
CREATE TYPE booking_type_enum AS ENUM ('direct_swap', 'credit_stay');
CREATE TYPE credit_tx_type_enum AS ENUM (
  'initial_grant',
  'reservation_hold',
  'reservation_release',
  'stay_debit',
  'host_reward',
  'compensation_adjustment'
);
CREATE TYPE tx_status_enum AS ENUM ('pending', 'posted', 'voided');
CREATE TYPE moderation_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE report_status_enum AS ENUM ('open', 'under_review', 'resolved', 'dismissed');

-- 1. PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  phone TEXT,
  verification_status verification_status_enum NOT NULL DEFAULT 'unverified',
  role user_role_enum NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PROPERTIES
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'apartment',
  bedrooms INT NOT NULL DEFAULT 1 CHECK (bedrooms > 0),
  guest_capacity INT NOT NULL DEFAULT 1 CHECK (guest_capacity > 0),
  amenities TEXT[] NOT NULL DEFAULT '{}',
  house_rules TEXT[] NOT NULL DEFAULT '{}',
  listing_status listing_status_enum NOT NULL DEFAULT 'draft',
  exact_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_launch_city CHECK (
    city IN ('Mumbai', 'Bengaluru', 'Delhi', 'Gurugram', 'Noida', 'Hyderabad')
  )
);

-- 3. PROPERTY PHOTOS
CREATE TABLE property_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  moderation_status moderation_status_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AVAILABILITY CALENDAR
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  availability_status availability_status_enum NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_property_date UNIQUE (property_id, date)
);

-- 5. PROPERTY SCORES (SWAPSCORE)
CREATE TABLE property_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  condition_score NUMERIC(5,2) NOT NULL CHECK (condition_score >= 0 AND condition_score <= 100),
  location_score NUMERIC(5,2) NOT NULL CHECK (location_score >= 0 AND location_score <= 100),
  amenities_score NUMERIC(5,2) NOT NULL CHECK (amenities_score >= 0 AND amenities_score <= 100),
  space_score NUMERIC(5,2) NOT NULL CHECK (space_score >= 0 AND space_score <= 100),
  listing_quality_score NUMERIC(5,2) NOT NULL CHECK (listing_quality_score >= 0 AND listing_quality_score <= 100),
  total_score NUMERIC(5,2) NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  grade CHAR(1) NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'E')),
  method_version TEXT NOT NULL DEFAULT '1.0',
  evidence_status TEXT NOT NULL DEFAULT 'unverified',
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assessed_by UUID REFERENCES profiles(id)
);

-- 6. SWAP REQUESTS (DIRECT SWAPS)
CREATE TABLE swap_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requester_property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  recipient_property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  requester_check_in DATE NOT NULL,
  requester_check_out DATE NOT NULL,
  recipient_check_in DATE NOT NULL,
  recipient_check_out DATE NOT NULL,
  request_status swap_request_status_enum NOT NULL DEFAULT 'pending',
  requester_accepted_at TIMESTAMPTZ,
  recipient_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_req_dates CHECK (requester_check_out > requester_check_in),
  CONSTRAINT chk_rec_dates CHECK (recipient_check_out > recipient_check_in),
  CONSTRAINT chk_diff_users CHECK (requester_id <> recipient_id),
  CONSTRAINT chk_diff_props CHECK (requester_property_id <> recipient_property_id)
);

-- 7. SWAP AGREEMENTS
CREATE TABLE swap_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swap_request_id UUID NOT NULL UNIQUE REFERENCES swap_requests(id) ON DELETE CASCADE,
  agreement_version TEXT NOT NULL DEFAULT '1.0',
  terms_snapshot JSONB NOT NULL,
  requester_accepted_at TIMESTAMPTZ NOT NULL,
  recipient_accepted_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. BOOKINGS
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  guest_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  booking_status booking_status_enum NOT NULL DEFAULT 'requested',
  booking_type booking_type_enum NOT NULL,
  credit_price INT NOT NULL DEFAULT 0 CHECK (credit_price >= 0),
  swap_request_id UUID REFERENCES swap_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_booking_dates CHECK (check_out > check_in),
  CONSTRAINT chk_booking_users CHECK (guest_id <> host_id)
);

-- Exclusion constraint to guarantee no overlapping active/confirmed bookings per property
ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_confirmed_bookings
EXCLUDE USING gist (
  property_id WITH =,
  daterange(check_in, check_out, '[)') WITH &&
)
WHERE (booking_status = 'confirmed');

-- 9. CREDIT ACCOUNTS
CREATE TABLE credit_accounts (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  available_balance INT NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  reserved_balance INT NOT NULL DEFAULT 0 CHECK (reserved_balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CREDIT TRANSACTIONS (APPEND-ONLY AUDIT LEDGER)
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  transaction_type credit_tx_type_enum NOT NULL,
  amount INT NOT NULL,
  status tx_status_enum NOT NULL DEFAULT 'posted',
  idempotency_key TEXT UNIQUE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. REVIEWS (Only for completed stays)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  moderation_status moderation_status_enum NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_review_per_party UNIQUE (booking_id, reviewer_id)
);

-- 12. REPORTS & DISPUTES
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('property', 'booking', 'user')),
  target_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('safety', 'cleanliness', 'fraud', 'misrepresentation', 'other')),
  description TEXT NOT NULL,
  evidence_urls TEXT[] NOT NULL DEFAULT '{}',
  status report_status_enum NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. ADMIN AUDIT LOGS
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTERING
CREATE INDEX idx_properties_city_status ON properties(city, listing_status);
CREATE INDEX idx_availability_prop_date ON availability(property_id, date, availability_status);
CREATE INDEX idx_bookings_prop_dates ON bookings(property_id, check_in, check_out);
CREATE INDEX idx_bookings_guest ON bookings(guest_id, booking_status);
CREATE INDEX idx_bookings_host ON bookings(host_id, booking_status);
CREATE INDEX idx_credit_tx_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_swap_requests_participants ON swap_requests(requester_id, recipient_id, request_status);

-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  INSERT INTO public.credit_accounts (user_id, available_balance, reserved_balance)
  VALUES (NEW.id, 0, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can read basic profile, user can update bio and display_name
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Properties: Public can view active properties
CREATE POLICY "Active properties are viewable by everyone"
  ON properties FOR SELECT USING (listing_status = 'active' OR auth.uid() = owner_id);

CREATE POLICY "Users can create their own properties"
  ON properties FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own properties"
  ON properties FOR UPDATE USING (auth.uid() = owner_id);

-- Availability: Viewable by anyone, manageable by owner
CREATE POLICY "Availability viewable by everyone"
  ON availability FOR SELECT USING (true);

CREATE POLICY "Hosts can manage their property availability"
  ON availability FOR ALL USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = availability.property_id AND properties.owner_id = auth.uid())
  );

-- Property Scores: Viewable by everyone, mutations server-only
CREATE POLICY "Scores are viewable by everyone"
  ON property_scores FOR SELECT USING (true);

-- Swap Requests: Participants can view and update
CREATE POLICY "Swap requests viewable by participants"
  ON swap_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Requesters can create swap requests"
  ON swap_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Participants can update swap requests"
  ON swap_requests FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Bookings: Viewable by host and guest
CREATE POLICY "Bookings viewable by host and guest"
  ON bookings FOR SELECT USING (auth.uid() = guest_id OR auth.uid() = host_id);

-- Credit accounts: User can view their own wallet
CREATE POLICY "Users can view their own wallet"
  ON credit_accounts FOR SELECT USING (auth.uid() = user_id);

-- Credit transactions: User can view their own ledger history
CREATE POLICY "Users can view their own transactions"
  ON credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- Reviews: Viewable by everyone once approved
CREATE POLICY "Approved reviews are viewable by everyone"
  ON reviews FOR SELECT USING (moderation_status = 'approved');

CREATE POLICY "Booking participants can submit review"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
