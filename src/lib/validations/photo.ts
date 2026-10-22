import { z } from 'zod';

export const addPhotoSchema = z.object({
  storage_path: z.string().min(5, 'Valid storage path required'),
  display_order: z.number().int().min(0).default(0),
});

export type AddPhotoInput = z.infer<typeof addPhotoSchema>;
