import { z } from 'zod';

export const submitBankTransferSchema = z.object({
  body: z.object({
    packageId: z.string().min(1),
    slipUrl: z.string().url()
  })
});

export const initializeCheckoutSchema = z.object({
  body: z.object({
    packageId: z.string().min(1)
  })
});
