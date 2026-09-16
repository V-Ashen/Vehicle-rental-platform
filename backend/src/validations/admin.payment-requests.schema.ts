import { z } from 'zod';

export const rejectPaymentRequestSchema = z.object({
  body: z.object({
    rejectionReason: z.string().min(3, "Rejection reason must be provided")
  })
});
