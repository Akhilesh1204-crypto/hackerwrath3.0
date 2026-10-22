import { getAdminClient } from '@/lib/supabase/admin';
import { getNightDates } from './dates';
import { PropertySearchResultItem } from '@/types/api';

export interface MatchingCriteria {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minScore?: number;
  page?: number;
  limit?: number;
}

export class MatchingEngine {
  static async search(criteria: MatchingCriteria): Promise<{
    items: PropertySearchResultItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const supabase = getAdminClient();
    const page = criteria.page || 1;
    const limit = criteria.limit || 20;
    const offset = (page - 1) * limit;

    // 1. Build base query for active properties
    let query = supabase
      .from('properties')
      .select(`
        id,
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
        property_scores (
          total_score,
          grade,
          condition_score,
          location_score,
          amenities_score,
          space_score,
          listing_quality_score
        ),
        property_photos (
          storage_path,
          display_order
        )
      `, { count: 'exact' })
      .eq('listing_status', 'active');

    // 2. City filter (hard constraint)
    if (criteria.city) {
      query = query.eq('city', criteria.city);
    }

    // 3. Guest capacity filter (hard constraint)
    if (criteria.guests) {
      query = query.gte('guest_capacity', criteria.guests);
    }

    const { data: properties, count, error } = await query;

    if (error || !properties) {
      console.error('Error fetching search properties:', error);
      return { items: [], total: 0, page, limit };
    }

    // 4. If dates are provided, verify date-level availability and no overlapping confirmed bookings
    let candidates = properties;

    if (criteria.checkIn && criteria.checkOut) {
      const requiredNights = getNightDates(criteria.checkIn, criteria.checkOut);

      // Check each property for conflicting confirmed bookings
      const propertyIds = candidates.map((p) => p.id);

      if (propertyIds.length > 0) {
        // Query overlapping confirmed bookings
        const { data: conflictingBookings } = await supabase
          .from('bookings')
          .select('property_id')
          .in('property_id', propertyIds)
          .eq('booking_status', 'confirmed')
          .lt('check_in', criteria.checkOut)
          .gt('check_out', criteria.checkIn);

        const excludedPropertyIds = new Set(
          (conflictingBookings || []).map((b) => b.property_id)
        );

        candidates = candidates.filter((p) => !excludedPropertyIds.has(p.id));
      }
    }

    // 5. Transform and format items
    let results: PropertySearchResultItem[] = candidates.map((p: any) => {
      const scoreData = Array.isArray(p.property_scores) ? p.property_scores[0] : p.property_scores;
      const photos = Array.isArray(p.property_photos)
        ? p.property_photos
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((ph: any) => ph.storage_path)
        : [];

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        city: p.city,
        state: p.state,
        neighbourhood: p.neighbourhood,
        property_type: p.property_type,
        bedrooms: p.bedrooms,
        guest_capacity: p.guest_capacity,
        amenities: p.amenities || [],
        house_rules: p.house_rules || [],
        listing_status: p.listing_status,
        score: scoreData
          ? {
              total_score: Number(scoreData.total_score),
              grade: scoreData.grade,
              breakdown: {
                condition: Number(scoreData.condition_score),
                location: Number(scoreData.location_score),
                amenities: Number(scoreData.amenities_score),
                space: Number(scoreData.space_score),
                listing_quality: Number(scoreData.listing_quality_score),
              },
            }
          : undefined,
        photos,
      };
    });

    // 6. Optional minScore filter
    if (criteria.minScore !== undefined) {
      results = results.filter((r) => (r.score?.total_score ?? 0) >= criteria.minScore!);
    }

    // 7. Deterministic ranking: high SwapScore first, then closest guest capacity fit
    results.sort((a, b) => {
      const scoreA = a.score?.total_score ?? 0;
      const scoreB = b.score?.total_score ?? 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return a.guest_capacity - b.guest_capacity;
    });

    const paginated = results.slice(offset, offset + limit);

    return {
      items: paginated,
      total: results.length,
      page,
      limit,
    };
  }
}
