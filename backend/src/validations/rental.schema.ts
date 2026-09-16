import { z } from 'zod';

export const createRentalSchema = z.object({
  body: z.object({
    customerId: z.string().min(1),
    vehicleId: z.string().min(1),
    pickupAt: z.string().datetime(),
    expectedReturnAt: z.string().datetime()
  })
});

export const handoverSchema = z.object({
  body: z.object({
    odometer: z.number().min(0),
    fuelLevel: z.string().min(1),
    conditionStatus: z.enum(['GOOD', 'DAMAGED']),
    photoUrls: z.array(z.string().url()).optional(),
    notes: z.string().optional()
  })
});

export const returnRentalSchema = z.object({
  body: z.object({
    actualReturnAt: z.string().datetime(),
    endOdometer: z.number().min(0),
    endFuelLevel: z.string().min(1),
    damages: z.array(
      z.object({
        damageArea: z.string().min(1),
        damageType: z.string().min(1),
        description: z.string().min(1),
        estimatedCost: z.number().min(0),
        photoUrls: z.array(z.string().url()).optional()
      })
    ).optional(),
    otherCharges: z.number().min(0).optional(),
    requiresMaintenance: z.boolean(),
    gracePeriodMinutes: z.number().min(0),
    hourlyLateCharge: z.number().min(0)
  })
});
