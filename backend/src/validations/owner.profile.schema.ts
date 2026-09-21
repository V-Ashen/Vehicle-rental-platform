import { z } from 'zod';

export const updateOwnerProfileSchema = z.object({
  body: z.object({
    businessName: z.string().min(2).optional(),
    ownerNic: z.string().min(10).optional(),
    mobile: z.string().min(10).optional(),
    address: z.string().min(5).optional(),
    city: z.string().min(2).optional(),
    brNumber: z.string().optional(),
    logoUrl: z.string().url().optional(),
    
    // Rental Rules Settings
    gracePeriodMinutes: z.number().min(0).optional(),
    hourlyLateCharge: z.number().min(0).optional(),
    defaultIncludedKmPerDay: z.number().min(0).optional()
  })
});
