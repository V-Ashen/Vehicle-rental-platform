import { z } from 'zod';

export const updateTenantProfileStatusSchema = z.object({
  body: z.object({
    status: z.enum(['INCOMPLETE', 'PENDING', 'VERIFIED', 'REJECTED'])
  })
});

export const updateTenantAccountStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'DISABLED'])
  })
});
