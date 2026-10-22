import { z } from 'zod';

export const LAUNCH_CITIES = [
  'Mumbai',
  'Bengaluru',
  'Delhi',
  'Gurugram',
  'Noida',
  'Hyderabad',
] as const;

export const CITY_STATE_MAP: Record<string, string> = {
  Mumbai: 'Maharashtra',
  Bengaluru: 'Karnataka',
  Delhi: 'Delhi',
  Gurugram: 'Haryana',
  Noida: 'Uttar Pradesh',
  Hyderabad: 'Telangana',
};

export const createPropertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  description: z.string().min(20, 'Description must be at least 20 characters').max(3000),
  city: z.enum(LAUNCH_CITIES, {
    errorMap: () => ({ message: 'City must be one of Mumbai, Bengaluru, Delhi, Gurugram, Noida, or Hyderabad' }),
  }),
  state: z.string().min(2),
  neighbourhood: z.string().min(2, 'Neighbourhood is required').max(100),
  property_type: z.enum(['apartment', 'independent_house', 'villa', 'studio', 'penthouse']),
  bedrooms: z.number().int().min(1, 'At least 1 bedroom required').max(20),
  guest_capacity: z.number().int().min(1, 'Guest capacity must be at least 1').max(30),
  amenities: z.array(z.string()).default([]),
  house_rules: z.array(z.string()).default([]),
  exact_address: z.string().min(10, 'Exact address must be provided for verification').max(300),
});

export const updatePropertySchema = createPropertySchema.partial().omit({ exact_address: true }).extend({
  exact_address: z.string().min(10).max(300).optional(),
  listing_status: z.enum(['draft', 'pending_review', 'active', 'suspended', 'inactive']).optional(),
});

export const searchPropertySchema = z.object({
  city: z.enum(LAUNCH_CITIES).optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD').optional(),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD').optional(),
  guests: z.coerce.number().int().min(1).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type SearchPropertyInput = z.infer<typeof searchPropertySchema>;
