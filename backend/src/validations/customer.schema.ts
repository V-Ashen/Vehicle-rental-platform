import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    mobile: z.string().min(10),
    email: z.string().email(),
    nicPassport: z.string().min(5),
    drivingLicence: z.string().min(5),
    address: z.string().min(5)
  })
});

export const updateCustomerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    mobile: z.string().min(10).optional(),
    email: z.string().email().optional(),
    nicPassport: z.string().min(5).optional(),
    drivingLicence: z.string().min(5).optional(),
    address: z.string().min(5).optional(),
    status: z.enum(['ACTIVE', 'DISABLED']).optional()
  })
});
