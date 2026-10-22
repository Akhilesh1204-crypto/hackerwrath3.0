import { z } from 'zod';

export const conversationContextSchema = z.enum(['property', 'booking', 'swap', 'general']);

export const createConversationSchema = z.object({
  recipient_id: z.string().uuid(),
  property_id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),
  swap_request_id: z.string().uuid().optional(),
  context: conversationContextSchema.optional().default('general'),
  initial_message: z.string().trim().min(1).max(2000).optional(),
});

export const createMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});
