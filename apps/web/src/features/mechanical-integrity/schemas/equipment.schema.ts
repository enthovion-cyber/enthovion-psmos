import { z } from 'zod';

export const miEquipmentSchema = z.object({
  siteId: z.string().min(1, 'Site is required.'),
  unitId: z.string().min(1, 'Process unit is required.'),
  areaId: z.string().optional(),
  tag: z.string().min(1, 'Equipment tag is required.').max(48),
  name: z.string().min(1, 'Equipment name is required.').max(160),
  type: z.string().min(1, 'Equipment type is required.'),
  subtype: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  criticality: z.string().optional(),
  safetyCritical: z.boolean().optional()
});

export type MiEquipmentFormValues = z.infer<typeof miEquipmentSchema>;
