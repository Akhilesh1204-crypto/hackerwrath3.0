import { z } from 'zod';

export const updateAvailabilitySchema = z.object({
  dates: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
      status: z.enum(['available', 'unavailable']),
    })
  ).min(1, 'At least one date is required'),
});

export const getAvailabilityQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
});

export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
