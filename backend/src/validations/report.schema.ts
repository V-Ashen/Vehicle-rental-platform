import { z } from 'zod';

export const financialReportSchema = z.object({
  query: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  })
});
