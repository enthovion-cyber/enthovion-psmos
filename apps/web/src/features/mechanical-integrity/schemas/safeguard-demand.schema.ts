import { z } from 'zod';

export const safeguardDemandSchema = z.object({
  demandDate: z.string().min(1, 'Demand date is required'),
  demandType: z.string().optional(),
  demandResult: z.string().optional(),
  investigationRequired: z.boolean().optional(),
  notes: z.string().optional()
}).passthrough();

export type SafeguardDemandSchemaInput = z.infer<typeof safeguardDemandSchema>;
