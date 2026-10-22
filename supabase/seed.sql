-- SEED DATA FOR TESTING AND DEVELOPMENT
-- Note: Replace mock user IDs with real auth.users IDs when testing with active Supabase instances

DO $$
DECLARE
  u1 UUID := 'a1111111-1111-1111-1111-111111111111';
  u2 UUID := 'b2222222-2222-2222-2222-222222222222';
  u3 UUID := 'c3333333-3333-3333-3333-333333333333';
  p1 UUID := 'd4444444-4444-4444-4444-444444444444';
  p2 UUID := 'e5555555-5555-5555-5555-555555555555';
  p3 UUID := 'f6666666-6666-6666-6666-666666666666';
BEGIN
  -- Insert mock profiles (assuming users exist or for local mock testing)
  INSERT INTO profiles (id, display_name, bio, verification_status, role)
  VALUES 
    (u1, 'Aarav Sharma', 'Tech professional who travels frequently between Mumbai and Bangalore.', 'verified', 'member'),
    (u2, 'Priya Nair', 'Architect and avid reader based in Koramangala, Bengaluru.', 'verified', 'member'),
    (u3, 'Rohan Mehta', 'Consultant living in Cyber City, Gurugram.', 'verified', 'admin')
  ON CONFLICT (id) DO NOTHING;

  -- Wallets with starter test credits
  INSERT INTO credit_accounts (user_id, available_balance, reserved_balance)
  VALUES 
    (u1, 5, 0),
    (u2, 4, 0),
    (u3, 10, 0)
  ON CONFLICT (user_id) DO UPDATE SET available_balance = EXCLUDED.available_balance;

  -- Properties in Mumbai, Bengaluru, Gurugram
  INSERT INTO properties (id, owner_id, title, description, city, state, neighbourhood, property_type, bedrooms, guest_capacity, amenities, house_rules, listing_status, exact_address)
  VALUES 
    (
      p1, u1, 'Boutique Sea-view Apartment in Bandra',
      'Peaceful 2BHK located in Bandra West, near cafes and the promenade with high-speed WiFi and dedicated workspace.',
      'Mumbai', 'Maharashtra', 'Bandra West', 'apartment', 2, 3,
      ARRAY['WiFi', 'Air Conditioning', 'Kitchen', 'Elevator', 'Work Desk'],
      ARRAY['No smoking inside', 'Quiet hours after 10 PM', 'No pets'],
      'active', 'Flat 402, Sea Breeze, Perry Cross Road, Bandra West, Mumbai 400050'
    ),
    (
      p2, u2, 'Green Garden Studio in Koramangala',
      'Sunlit studio flat with private balcony and lush garden view in central Bengaluru tech corridor.',
      'Bengaluru', 'Karnataka', 'Koramangala 4th Block', 'studio', 1, 2,
      ARRAY['WiFi', 'Kitchenette', 'Garden', 'Power Backup', 'Washing Machine'],
      ARRAY['No loud parties', 'Conserve water'],
      'active', '12, 5th Cross, Koramangala 4th Block, Bengaluru 560034'
    ),
    (
      p3, u3, 'Modern High-Rise Apartment near DLF Cyber City',
      'Spacious 3BHK high-rise apartment in Gurugram, minutes away from the Rapid Metro and business hubs.',
      'Gurugram', 'Haryana', 'Sector 25 / Cyber City', 'apartment', 3, 5,
      ARRAY['WiFi', 'Air Conditioning', 'Gym', 'Swimming Pool', 'Security 24/7'],
      ARRAY['ID verification required by society gate', 'No unauthorized visitors'],
      'active', 'Tower B - 1204, Phase 2, DLF Cyber City, Gurugram 122002'
    )
  ON CONFLICT (id) DO NOTHING;

  -- Property Scores
  INSERT INTO property_scores (property_id, condition_score, location_score, amenities_score, space_score, listing_quality_score, total_score, grade, evidence_status)
  VALUES
    (p1, 90.0, 95.0, 85.0, 80.0, 90.0, 88.75, 'A', 'verified'),
    (p2, 85.0, 80.0, 75.0, 70.0, 85.0, 79.50, 'B', 'verified'),
    (p3, 92.0, 88.0, 90.0, 95.0, 88.0, 90.45, 'A', 'verified')
  ON CONFLICT (property_id) DO NOTHING;

  -- Initial ledger entries for transparency
  INSERT INTO credit_transactions (user_id, transaction_type, amount, status, description)
  VALUES
    (u1, 'initial_grant', 5, 'posted', 'Pilot starter credit allocation'),
    (u2, 'initial_grant', 4, 'posted', 'Pilot starter credit allocation'),
    (u3, 'initial_grant', 10, 'posted', 'Admin initial test grant');

END $$;
