import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    businessName: z.string().min(2, 'Business Name must be at least 2 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(8, 'Phone number is too short'),
    address: z.string().min(5, 'Address is too short'),
    city: z.string().min(2, 'City is required'),
  })
});
