-- CLEAN SEED DATA SCRIPT FOR SUPABASE
-- Run this in Supabase SQL Editor to create sample test users, wallets, and verified listings

-- 1. Create test auth users if they don't already exist
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    'a1111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'aarav.sharma@example.com',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Aarav Sharma"}',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'b2222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'priya.nair@example.com',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Priya Nair"}',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'c3333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'rohan.mehta@example.com',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Rohan Mehta"}',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Update profiles with bio and verified status
UPDATE public.profiles
SET bio = 'Tech professional who travels frequently between Mumbai and Bangalore.',
    verification_status = 'verified',
    role = 'member'
WHERE id = 'a1111111-1111-1111-1111-111111111111';

UPDATE public.profiles
SET bio = 'Architect and avid reader based in Koramangala, Bengaluru.',
    verification_status = 'verified',
    role = 'member'
WHERE id = 'b2222222-2222-2222-2222-222222222222';

UPDATE public.profiles
SET bio = 'Consultant living in Cyber City, Gurugram.',
    verification_status = 'verified',
    role = 'admin'
WHERE id = 'c3333333-3333-3333-3333-333333333333';

-- 3. Set initial test credits in wallets
UPDATE public.credit_accounts SET available_balance = 5 WHERE user_id = 'a1111111-1111-1111-1111-111111111111';
UPDATE public.credit_accounts SET available_balance = 4 WHERE user_id = 'b2222222-2222-2222-2222-222222222222';
UPDATE public.credit_accounts SET available_balance = 10 WHERE user_id = 'c3333333-3333-3333-3333-333333333333';

-- 4. Insert properties in Mumbai, Bengaluru, Gurugram
INSERT INTO public.properties (
  id,
  owner_id,
  title,
  description,
  city,
  state,
  neighbourhood,
  property_type,
  bedrooms,
  guest_capacity,
  amenities,
  house_rules,
  listing_status,
  exact_address
)
VALUES 
  (
    'd4444444-4444-4444-4444-444444444444',
    'a1111111-1111-1111-1111-111111111111',
    'Boutique Sea-view Apartment in Bandra',
    'Peaceful 2BHK located in Bandra West, near cafes and the promenade with high-speed WiFi and dedicated workspace.',
    'Mumbai',
    'Maharashtra',
    'Bandra West',
    'apartment',
    2,
    3,
    ARRAY['WiFi', 'Air Conditioning', 'Kitchen', 'Elevator', 'Work Desk'],
    ARRAY['No smoking inside', 'Quiet hours after 10 PM', 'No pets'],
    'active',
    'Flat 402, Sea Breeze, Perry Cross Road, Bandra West, Mumbai 400050'
  ),
  (
    'e5555555-5555-5555-5555-555555555555',
    'b2222222-2222-2222-2222-222222222222',
    'Green Garden Studio in Koramangala',
    'Sunlit studio flat with private balcony and lush garden view in central Bengaluru tech corridor.',
    'Bengaluru',
    'Karnataka',
    'Koramangala 4th Block',
    'studio',
    1,
    2,
    ARRAY['WiFi', 'Kitchenette', 'Garden', 'Power Backup', 'Washing Machine'],
    ARRAY['No loud parties', 'Conserve water'],
    'active',
    '12, 5th Cross, Koramangala 4th Block, Bengaluru 560034'
  ),
  (
    'f6666666-6666-6666-6666-666666666666',
    'c3333333-3333-3333-3333-333333333333',
    'Modern High-Rise Apartment near DLF Cyber City',
    'Spacious 3BHK high-rise apartment in Gurugram, minutes away from the Rapid Metro and business hubs.',
    'Gurugram',
    'Haryana',
    'Sector 25 / Cyber City',
    'apartment',
    3,
    5,
    ARRAY['WiFi', 'Air Conditioning', 'Gym', 'Swimming Pool', 'Security 24/7'],
    ARRAY['ID verification required by society gate', 'No unauthorized visitors'],
    'active',
    'Tower B - 1204, Phase 2, DLF Cyber City, Gurugram 122002'
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Insert SwapScores for the seeded properties
INSERT INTO public.property_scores (
  property_id,
  condition_score,
  location_score,
  amenities_score,
  space_score,
  listing_quality_score,
  total_score,
  grade,
  evidence_status
)
VALUES
  ('d4444444-4444-4444-4444-444444444444', 90.0, 95.0, 85.0, 80.0, 90.0, 88.75, 'A', 'verified'),
  ('e5555555-5555-5555-5555-555555555555', 85.0, 80.0, 75.0, 70.0, 85.0, 79.50, 'B', 'verified'),
  ('f6666666-6666-6666-6666-666666666666', 92.0, 88.0, 90.0, 95.0, 88.0, 90.45, 'A', 'verified')
ON CONFLICT (property_id) DO NOTHING;

-- 6. Initial ledger entries
INSERT INTO public.credit_transactions (user_id, transaction_type, amount, status, description)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'initial_grant', 5, 'posted', 'Pilot starter credit allocation'),
  ('b2222222-2222-2222-2222-222222222222', 'initial_grant', 4, 'posted', 'Pilot starter credit allocation'),
  ('c3333333-3333-3333-3333-333333333333', 'initial_grant', 10, 'posted', 'Admin initial test grant');
