import { z } from 'zod';

export const createReportSchema = z.object({
  target_type: z.enum(['property', 'booking', 'user']),
  target_id: z.string().uuid(),
  category: z.enum(['safety', 'cleanliness', 'fraud', 'misrepresentation', 'other']),
  description: z.string().min(20, 'Please provide details for the report (min 20 characters)').max(2000),
  evidence_urls: z.array(z.string().url()).default([]),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
