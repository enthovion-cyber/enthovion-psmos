import { z } from 'zod';

export const incidentEquipmentSchema = z.object({
  equipmentTag: z.string().optional(),
  equipmentName: z.string().optional(),
  equipmentType: z.string().optional(),
  equipmentStatus: z.string().optional()
});
