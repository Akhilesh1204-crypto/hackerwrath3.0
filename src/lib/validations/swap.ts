import { z } from 'zod';

export const createSwapRequestSchema = z.object({
  requester_property_id: z.string().uuid(),
  recipient_property_id: z.string().uuid(),
  requester_check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requester_check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recipient_check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recipient_check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine(
  (data) => data.requester_check_out > data.requester_check_in,
  {
    message: 'Requester check-out date must be after check-in date',
    path: ['requester_check_out'],
  }
).refine(
  (data) => data.recipient_check_out > data.recipient_check_in,
  {
    message: 'Recipient check-out date must be after check-in date',
    path: ['recipient_check_out'],
  }
).refine(
  (data) => data.requester_property_id !== data.recipient_property_id,
  {
    message: 'Cannot create a swap between the same property',
    path: ['recipient_property_id'],
  }
);

export const respondSwapRequestSchema = z.object({
  action: z.enum(['accept', 'decline', 'cancel']),
  reason: z.string().optional(),
});

export type CreateSwapRequestInput = z.infer<typeof createSwapRequestSchema>;
export type RespondSwapRequestInput = z.infer<typeof respondSwapRequestSchema>;
