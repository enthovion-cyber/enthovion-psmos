import { z } from 'zod';

export const capacityBasisSchema = z.object({
  design_capacity: z.coerce.number().optional().nullable(),
  capacity_unit: z.string().optional().nullable(),
  design_flow: z.coerce.number().optional().nullable(),
  flow_unit: z.string().optional().nullable(),
  design_inventory_volume: z.coerce.number().optional().nullable(),
  volume_unit: z.string().optional().nullable()
});
