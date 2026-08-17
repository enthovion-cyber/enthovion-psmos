import { z } from 'zod';

export const materialBasisSchema = z.object({
  material_of_construction: z.string().optional().nullable(),
  corrosion_allowance: z.coerce.number().optional().nullable(),
  corrosion_allowance_unit: z.string().optional().nullable(),
  material_compatibility_notes: z.string().optional().nullable()
});
