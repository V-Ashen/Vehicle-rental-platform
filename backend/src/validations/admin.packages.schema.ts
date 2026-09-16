import { z } from 'zod';

export const createPackageSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    monthlyPrice: z.number().min(0),
    yearlyPrice: z.number().min(0),
    trialDays: z.number().min(0).default(14),
    maxVehicles: z.number().min(1),
    maxUsers: z.number().min(1),
    features: z.record(z.string(), z.any())
  })
});

export const updatePackageSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    monthlyPrice: z.number().min(0).optional(),
    yearlyPrice: z.number().min(0).optional(),
    trialDays: z.number().min(0).optional(),
    maxVehicles: z.number().min(1).optional(),
    maxUsers: z.number().min(1).optional(),
    features: z.record(z.string(), z.any()).optional()
  })
});

export const updatePackageStatusSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'])
  })
});
