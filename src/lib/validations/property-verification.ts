import { z } from 'zod';

export const propertyVerificationSchema = z
  .object({
    ownership_document_path: z.string().trim().min(5).optional(),
    lease_document_path: z.string().trim().min(5).optional(),
    physical_code_photo_path: z.string().trim().min(5, 'Upload a photo of the verification code inside the home.'),
  })
  .refine(
    (value) => Boolean(value.ownership_document_path || value.lease_document_path),
    { message: 'Add an ownership or lease document.', path: ['ownership_document_path'] },
  );

export const propertyMediaSchema = z.object({
  media_type: z.enum(['photo', 'video']),
  storage_path: z.string().trim().min(5),
  display_order: z.number().int().min(0).optional().default(0),
  duration_seconds: z.number().int().min(1).max(60).optional(),
});

export const propertyVerificationDecisionSchema = z.object({
  decision: z.enum(['verified', 'rejected']),
  notes: z.string().trim().max(500).optional(),
});
