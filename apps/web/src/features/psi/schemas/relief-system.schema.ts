import { z } from 'zod';

export const reliefSystemSchema = z.object({
  unit_id: z.string().min(1, 'Process unit is required.'),
  protected_equipment_id: z.string().min(1, 'Protected equipment is required.'),
  protected_equipment_tag: z.string().min(1, 'Protected equipment tag is required.'),
  protected_equipment_name: z.string().min(1, 'Protected equipment name is required.'),
  relief_basis_title: z.string().min(1, 'Relief basis title is required.'),
  relief_system_type: z.string().min(1, 'Relief system type is required.'),
  service_fluid: z.string().optional(),
  fluid_phase: z.string().optional(),
  owner_user_id: z.string().optional()
}).passthrough();
