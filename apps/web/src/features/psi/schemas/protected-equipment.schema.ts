import { z } from 'zod';

export const protectedEquipmentSchema = z.object({
  equipment_id: z.string().min(1, 'Equipment ID is required.'),
  equipment_tag: z.string().min(1, 'Equipment tag is required.'),
  equipment_name: z.string().min(1, 'Equipment name is required.'),
  equipment_role: z.string().optional(),
  isolation_status: z.string().optional(),
  safety_critical: z.boolean().optional()
}).passthrough();
