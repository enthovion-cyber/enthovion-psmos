import { z } from 'zod';

export const reliefSizingBasisSchema = z.object({
  required_relief_rate: z.coerce.number().optional(),
  rated_capacity: z.coerce.number().optional(),
  capacity_margin_percent: z.coerce.number().optional(),
  calculation_status: z.string().optional(),
  calculation_document_id: z.string().optional()
}).passthrough();
