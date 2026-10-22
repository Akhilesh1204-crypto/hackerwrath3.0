import { z } from 'zod';

export const updateProfileSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
