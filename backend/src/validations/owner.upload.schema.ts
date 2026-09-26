import { z } from 'zod';

export const generateSignedUrlSchema = z.object({
  body: z.object({
    fileName: z.string().min(1),
    contentType: z.string().min(1),
    fileCategory: z.enum(['business', 'vehicles', 'rentals', 'documents', 'handover', 'damage'])
  })
});
