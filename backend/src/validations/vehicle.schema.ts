import { z } from 'zod';

export const createVehicleSchema = z.object({
  body: z.object({
    registrationNumber: z.string().min(2),
    make: z.string().min(2),
    model: z.string().min(1),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    vehicleType: z.string().min(2),
    currentOdometer: z.number().min(0),
    dailyRate: z.number().min(0),
    extraKmRate: z.number().min(0),
    includedKmPerDay: z.number().min(0),
    depositAmount: z.number().min(0)
  })
});

export const updateVehicleSchema = z.object({
  body: z.object({
    registrationNumber: z.string().min(2).optional(),
    make: z.string().min(2).optional(),
    model: z.string().min(1).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    vehicleType: z.string().min(2).optional(),
    currentOdometer: z.number().min(0).optional(),
    dailyRate: z.number().min(0).optional(),
    extraKmRate: z.number().min(0).optional(),
    includedKmPerDay: z.number().min(0).optional(),
    depositAmount: z.number().min(0).optional(),
    status: z.enum(['AVAILABLE', 'RESERVED', 'ON_RENT', 'MAINTENANCE']).optional()
  })
});
