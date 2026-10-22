import { describe, it, expect } from 'vitest';
import { createPropertySchema, searchPropertySchema, LAUNCH_CITIES } from '../src/lib/validations/property';
import { createBookingRequestSchema } from '../src/lib/validations/booking';
import { createSwapRequestSchema } from '../src/lib/validations/swap';
import { createReviewSchema } from '../src/lib/validations/review';

describe('Validation Schemas', () => {
  describe('Property Schemas', () => {
    it('accepts all 6 supported launch markets', () => {
      for (const city of LAUNCH_CITIES) {
        const result = createPropertySchema.safeParse({
          title: 'Cozy Modern Studio in the Heart of the City',
          description: 'A wonderful spacious property with high speed WiFi and dedicated work area.',
          city,
          state: 'State',
          neighbourhood: 'Central Area',
          property_type: 'apartment',
          bedrooms: 2,
          guest_capacity: 3,
          amenities: ['WiFi', 'Kitchen'],
          house_rules: ['No smoking'],
          exact_address: '123 Test Street, Apartment 4B',
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects unsupported cities (e.g. Pune, Chennai, London)', () => {
      const result = createPropertySchema.safeParse({
        title: 'Modern Flat in Pune',
        description: 'A wonderful spacious property with high speed WiFi and dedicated work area.',
        city: 'Pune',
        state: 'Maharashtra',
        neighbourhood: 'Kothrud',
        property_type: 'apartment',
        bedrooms: 1,
        guest_capacity: 2,
        exact_address: '123 Test Street',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Booking Request Schemas', () => {
    it('rejects booking when check-out is before or equal to check-in', () => {
      const sameDate = createBookingRequestSchema.safeParse({
        property_id: '11111111-1111-1111-1111-111111111111',
        check_in: '2026-11-10',
        check_out: '2026-11-10',
      });
      expect(sameDate.success).toBe(false);

      const invertedDate = createBookingRequestSchema.safeParse({
        property_id: '11111111-1111-1111-1111-111111111111',
        check_in: '2026-11-15',
        check_out: '2026-11-10',
      });
      expect(invertedDate.success).toBe(false);
    });

    it('accepts valid booking dates', () => {
      const valid = createBookingRequestSchema.safeParse({
        property_id: '11111111-1111-1111-1111-111111111111',
        check_in: '2026-11-10',
        check_out: '2026-11-15',
      });
      expect(valid.success).toBe(true);
    });
  });

  describe('Direct Swap Request Schemas', () => {
    it('rejects swap proposals between identical properties', () => {
      const propId = '11111111-1111-1111-1111-111111111111';
      const result = createSwapRequestSchema.safeParse({
        requester_property_id: propId,
        recipient_property_id: propId,
        requester_check_in: '2026-11-01',
        requester_check_out: '2026-11-05',
        recipient_check_in: '2026-11-01',
        recipient_check_out: '2026-11-05',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Review Schemas', () => {
    it('restricts rating between 1 and 5', () => {
      const zeroRating = createReviewSchema.safeParse({
        booking_id: '11111111-1111-1111-1111-111111111111',
        rating: 0,
        comment: 'Great stay, everything was clean!',
      });
      expect(zeroRating.success).toBe(false);

      const sixRating = createReviewSchema.safeParse({
        booking_id: '11111111-1111-1111-1111-111111111111',
        rating: 6,
        comment: 'Great stay, everything was clean!',
      });
      expect(sixRating.success).toBe(false);

      const validRating = createReviewSchema.safeParse({
        booking_id: '11111111-1111-1111-1111-111111111111',
        rating: 5,
        comment: 'Great stay, everything was clean and comfortable!',
      });
      expect(validRating.success).toBe(true);
    });
  });
});
