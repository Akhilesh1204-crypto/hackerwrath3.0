import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { ok, internalError } from '@/lib/api-response';

// POST /api/seed - Helper to populate demo launch properties, swaps, stays, wallets, and reports
export async function POST(req: NextRequest) {
  const supabase = getAdminClient();

  try {
    // 1. Create or retrieve auth users
    const getOrCreateUser = async (email: string, displayName: string) => {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existing = users.find((u) => u.email === email);
      if (existing) {
        return existing.id;
      }

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });

      if (error || !data.user) {
        throw new Error(`Failed to create user ${email}: ${error?.message}`);
      }
      return data.user.id;
    };

    const u1 = await getOrCreateUser('aarav.sharma@example.com', 'Aarav Sharma');
    const u2 = await getOrCreateUser('priya.nair@example.com', 'Priya Nair');
    const u3 = await getOrCreateUser('rohan.mehta@example.com', 'Rohan Mehta');

    // 2. Update user profiles and wallets
    await supabase.from('profiles').update({
      bio: 'Tech founder frequently traveling between Mumbai and Bengaluru.',
      verification_status: 'verified',
    }).eq('id', u1);

    await supabase.from('profiles').update({
      bio: 'Architect and avid reader based in Koramangala, Bengaluru.',
      verification_status: 'verified',
    }).eq('id', u2);

    await supabase.from('profiles').update({
      bio: 'Consultant living in DLF Cyber City, Gurugram.',
      verification_status: 'verified',
      role: 'admin',
    }).eq('id', u3);

    await supabase.from('credit_accounts').update({ available_balance: 5, reserved_balance: 0 }).eq('user_id', u1);
    await supabase.from('credit_accounts').update({ available_balance: 4, reserved_balance: 2 }).eq('user_id', u2);
    await supabase.from('credit_accounts').update({ available_balance: 10, reserved_balance: 0 }).eq('user_id', u3);

    // 3. Properties in Mumbai, Bengaluru, Gurugram
    const sampleProperties = [
      {
        owner_id: u1,
        title: 'Boutique Sea-view Apartment in Bandra',
        description: 'Peaceful 2BHK located in Bandra West, near cafes and the promenade with high-speed WiFi and dedicated workspace.',
        city: 'Mumbai',
        state: 'Maharashtra',
        neighbourhood: 'Bandra West',
        property_type: 'apartment',
        bedrooms: 2,
        guest_capacity: 3,
        amenities: ['WiFi', 'Air Conditioning', 'Kitchen', 'Elevator', 'Work Desk'],
        house_rules: ['No smoking inside', 'Quiet hours after 10 PM', 'No pets'],
        listing_status: 'active',
        exact_address: 'Flat 402, Sea Breeze, Perry Cross Road, Bandra West, Mumbai 400050',
      },
      {
        owner_id: u2,
        title: 'Green Garden Studio in Koramangala',
        description: 'Sunlit studio flat with private balcony and lush garden view in central Bengaluru tech corridor.',
        city: 'Bengaluru',
        state: 'Karnataka',
        neighbourhood: 'Koramangala 4th Block',
        property_type: 'studio',
        bedrooms: 1,
        guest_capacity: 2,
        amenities: ['WiFi', 'Kitchenette', 'Garden', 'Power Backup', 'Washing Machine'],
        house_rules: ['No loud parties', 'Conserve water'],
        listing_status: 'active',
        exact_address: '12, 5th Cross, Koramangala 4th Block, Bengaluru 560034',
      },
      {
        owner_id: u3,
        title: 'Modern High-Rise Apartment near DLF Cyber City',
        description: 'Spacious 3BHK high-rise apartment in Gurugram, minutes away from the Rapid Metro and business hubs.',
        city: 'Gurugram',
        state: 'Haryana',
        neighbourhood: 'Sector 25 / Cyber City',
        property_type: 'apartment',
        bedrooms: 3,
        guest_capacity: 5,
        amenities: ['WiFi', 'Air Conditioning', 'Gym', 'Swimming Pool', 'Security 24/7'],
        house_rules: ['ID verification required by society gate', 'No unauthorized visitors'],
        listing_status: 'active',
        exact_address: 'Tower B - 1204, Phase 2, DLF Cyber City, Gurugram 122002',
      },
    ];

    const insertedProperties: string[] = [];

    for (const prop of sampleProperties) {
      const { data: existing } = await supabase
        .from('properties')
        .select('id')
        .eq('title', prop.title)
        .maybeSingle();

      let propertyId = existing?.id;

      if (!propertyId) {
        const { data: created, error: createErr } = await supabase
          .from('properties')
          .insert(prop)
          .select('id')
          .single();

        if (createErr || !created) {
          throw new Error(`Failed to insert property: ${createErr?.message}`);
        }
        propertyId = created.id;
      }

      insertedProperties.push(propertyId);
    }

    // 4. Attach Property Scores
    const scores = [
      {
        property_id: insertedProperties[0],
        condition_score: 90.0,
        location_score: 95.0,
        amenities_score: 85.0,
        space_score: 80.0,
        listing_quality_score: 90.0,
        total_score: 88.75,
        grade: 'A',
        evidence_status: 'verified',
      },
      {
        property_id: insertedProperties[1],
        condition_score: 85.0,
        location_score: 80.0,
        amenities_score: 75.0,
        space_score: 70.0,
        listing_quality_score: 85.0,
        total_score: 79.50,
        grade: 'B',
        evidence_status: 'verified',
      },
      {
        property_id: insertedProperties[2],
        condition_score: 92.0,
        location_score: 88.0,
        amenities_score: 90.0,
        space_score: 95.0,
        listing_quality_score: 88.0,
        total_score: 90.45,
        grade: 'A',
        evidence_status: 'verified',
      },
    ];

    for (const score of scores) {
      await supabase.from('property_scores').upsert(score, { onConflict: 'property_id' });
    }

    // 5. Attach Sample Photos
    const photos = [
      {
        property_id: insertedProperties[0],
        storage_path: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
        display_order: 1,
        moderation_status: 'approved',
      },
      {
        property_id: insertedProperties[1],
        storage_path: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
        display_order: 1,
        moderation_status: 'approved',
      },
      {
        property_id: insertedProperties[2],
        storage_path: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
        display_order: 1,
        moderation_status: 'approved',
      },
    ];

    for (const photo of photos) {
      const { data: existingPhoto } = await supabase
        .from('property_photos')
        .select('id')
        .eq('property_id', photo.property_id)
        .maybeSingle();

      if (!existingPhoto) {
        await supabase.from('property_photos').insert(photo);
      }
    }

    // 6. POPULATE A DEMO PENDING DIRECT SWAP
    // Aarav (Mumbai) proposed swap to Priya (Bengaluru)
    const { data: existingSwap } = await supabase
      .from('swap_requests')
      .select('id')
      .eq('requester_id', u1)
      .eq('recipient_id', u2)
      .maybeSingle();

    if (!existingSwap) {
      await supabase.from('swap_requests').insert({
        requester_id: u1,
        recipient_id: u2,
        requester_property_id: insertedProperties[0],
        recipient_property_id: insertedProperties[1],
        requester_check_in: '2026-11-10',
        requester_check_out: '2026-11-15',
        recipient_check_in: '2026-11-10',
        recipient_check_out: '2026-11-15',
        request_status: 'pending',
        requester_accepted_at: new Date().toISOString(),
      });
    }

    // 7. POPULATE DEMO CREDIT BOOKINGS
    // A) Priya requested a stay at Rohan's Gurugram home (status: requested -> Rohan can confirm)
    const { data: existingBooking1 } = await supabase
      .from('bookings')
      .select('id')
      .eq('guest_id', u2)
      .eq('host_id', u3)
      .maybeSingle();

    if (!existingBooking1) {
      await supabase.from('bookings').insert({
        property_id: insertedProperties[2],
        guest_id: u2,
        host_id: u3,
        check_in: '2026-12-01',
        check_out: '2026-12-03',
        booking_status: 'requested',
        booking_type: 'credit_stay',
        credit_price: 2,
      });
    }

    // B) Completed stay between Rohan and Aarav (status: completed -> eligible for reviews!)
    const { data: existingBooking2 } = await supabase
      .from('bookings')
      .select('id')
      .eq('guest_id', u3)
      .eq('host_id', u1)
      .maybeSingle();

    if (!existingBooking2) {
      await supabase.from('bookings').insert({
        property_id: insertedProperties[0],
        guest_id: u3,
        host_id: u1,
        check_in: '2026-10-01',
        check_out: '2026-10-03',
        booking_status: 'completed',
        booking_type: 'credit_stay',
        credit_price: 2,
      });
    }

    // 8. POPULATE DEMO WALLET TRANSACTIONS
    const transactions = [
      {
        user_id: u1,
        transaction_type: 'initial_grant',
        amount: 5,
        status: 'posted',
        description: 'Pilot starter credit allocation for launch market host',
      },
      {
        user_id: u1,
        transaction_type: 'host_reward',
        amount: 2,
        status: 'posted',
        description: 'Host reward for completed 2-night stay at Bandra Apartment',
      },
      {
        user_id: u2,
        transaction_type: 'initial_grant',
        amount: 6,
        status: 'posted',
        description: 'Pilot starter credit allocation',
      },
      {
        user_id: u2,
        transaction_type: 'reservation_hold',
        amount: -2,
        status: 'posted',
        description: 'Hold 2 credits for pending stay request at Gurugram High-Rise',
      },
      {
        user_id: u3,
        transaction_type: 'initial_grant',
        amount: 10,
        status: 'posted',
        description: 'Admin testing starter grant',
      },
    ];

    for (const tx of transactions) {
      const { data: existingTx } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_id', tx.user_id)
        .eq('description', tx.description)
        .maybeSingle();

      if (!existingTx) {
        await supabase.from('credit_transactions').insert(tx);
      }
    }

    // 9. POPULATE DEMO ADMIN SAFETY/INCIDENT REPORT
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', u2)
      .maybeSingle();

    if (!existingReport) {
      await supabase.from('reports').insert({
        reporter_id: u2,
        target_type: 'property',
        target_id: insertedProperties[0],
        category: 'cleanliness',
        description: 'Host was 15 minutes late for key handover during trial swap exchange.',
        status: 'open',
      });
    }

    return ok({
      message: 'Successfully populated demo properties, pending swaps, active stays, wallet ledgers, and admin reports!',
      demo_users: {
        aarav: u1,
        priya: u2,
        rohan_admin: u3,
      },
    });
  } catch (err: any) {
    return internalError('Error seeding demo data', err?.message);
  }
}
