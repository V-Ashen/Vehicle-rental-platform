import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  body: z.object({
    vehicleId: z.string().min(1),
    maintenanceType: z.enum(['SERVICE', 'REPAIR', 'INSPECTION']),
    description: z.string().min(1),
    serviceDate: z.string().datetime(),
    odometer: z.number().min(0),
    cost: z.number().min(0),
    nextServiceDate: z.string().datetime().optional().nullable(),
    nextServiceOdometer: z.number().min(0).optional().nullable(),
    markVehicleAvailable: z.boolean().optional()
  })
});
