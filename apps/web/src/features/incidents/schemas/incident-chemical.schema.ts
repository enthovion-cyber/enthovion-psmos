import { z } from 'zod';

export const incidentChemicalSchema = z.object({
  chemicalName: z.string().optional(),
  casNumber: z.string().optional(),
  sdsId: z.string().optional(),
  releasedQuantity: z.string().optional()
});
