import { z } from 'zod';

export const miEquipmentFiltersSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  status: z.string().optional(),
  criticality: z.string().optional(),
  equipmentType: z.string().optional(),
  siteId: z.string().optional(),
  unitId: z.string().optional(),
  areaId: z.string().optional(),
  safetyCritical: z.string().optional()
});
