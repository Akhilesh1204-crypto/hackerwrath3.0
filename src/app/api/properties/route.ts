import { NextRequest } from 'next/server';
import { getAuthUser, isVerifiedMember } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { createPropertySchema, CITY_STATE_MAP } from '@/lib/validations/property';
import { ok, unauthorized, badRequest, internalError } from '@/lib/api-response';
import { calculateSwapScore } from '@/lib/services/swapscore';

// POST /api/properties - Create listing
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to create a listing');
  }
  if (!(await isVerifiedMember(user.id))) {
    return badRequest('FORBIDDEN', 'Verification is required before listing a home');
  }

  try {
    const json = await req.json();
    const result = createPropertySchema.safeParse(json);

    if (!result.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid property listing data', result.error.format());
    }

    const data = result.data;
    // Guarantee correct state according to city
    const state = CITY_STATE_MAP[data.city] || data.state;

    const supabase = getAdminClient();

    // Insert property
    const { data: property, error: propError } = await supabase
      .from('properties')
      .insert({
        owner_id: user.id,
        title: data.title,
        description: data.description,
        city: data.city,
        state,
        neighbourhood: data.neighbourhood,
        property_type: data.property_type,
        bedrooms: data.bedrooms,
        guest_capacity: data.guest_capacity,
        amenities: data.amenities,
        house_rules: data.house_rules,
        listing_status: 'pending_review',
        exact_address: data.exact_address,
      })
      .select()
      .single();

    if (propError || !property) {
      return internalError('Failed to create property listing', propError?.message);
    }

    // Initialize baseline SwapScore based on amenities and details
    const amenitiesFactor = Math.min(100, data.amenities.length * 15);
    const spaceFactor = Math.min(100, data.bedrooms * 25 + data.guest_capacity * 10);
    const initialScore = calculateSwapScore({
      condition: 75,
      location: 80,
      amenities: amenitiesFactor,
      space: spaceFactor,
      listingQuality: 70,
    });

    await supabase.from('property_scores').insert({
      property_id: property.id,
      condition_score: initialScore.breakdown.condition,
      location_score: initialScore.breakdown.location,
      amenities_score: initialScore.breakdown.amenities,
      space_score: initialScore.breakdown.space,
      listing_quality_score: initialScore.breakdown.listingQuality,
      total_score: initialScore.totalScore,
      grade: initialScore.grade,
      evidence_status: 'unverified',
    });

    return ok(property, undefined, 201);
  } catch (err: any) {
    return internalError('Server error while creating listing', err?.message);
  }
}

// GET /api/properties - Get caller's own listings
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to view your listings');
  }

  const supabase = getAdminClient();
  const { data: properties, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_scores (*),
      property_photos (*)
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return internalError('Failed to retrieve listings', error.message);
  }

  return ok(properties || []);
}
