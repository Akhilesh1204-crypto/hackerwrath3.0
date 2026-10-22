import { z } from 'zod';

export const createBookingRequestSchema = z.object({
  property_id: z.string().uuid(),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  idempotency_key: z.string().min(10).optional(),
}).refine(
  (data) => data.check_out > data.check_in,
  {
    message: 'Check-out date must be strictly after check-in date',
    path: ['check_out'],
  }
);

export const cancelBookingSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
});

export type CreateBookingRequestInput = z.infer<typeof createBookingRequestSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
