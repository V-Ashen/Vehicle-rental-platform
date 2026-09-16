import { z } from 'zod';

export const createVehicleDocumentSchema = z.object({
  body: z.object({
    documentType: z.enum(['INSURANCE', 'REVENUE', 'EMISSION', 'OTHER']),
    documentNumber: z.string().min(1),
    issueDate: z.string().datetime(),
    expiryDate: z.string().datetime(),
    fileUrl: z.string().url()
  })
});
