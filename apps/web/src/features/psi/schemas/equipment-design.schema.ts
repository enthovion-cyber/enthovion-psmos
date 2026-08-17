import { z } from 'zod';

const optionalNumber = z.union([z.coerce.number(), z.literal('').transform(() => null)]).optional().nullable();

export const equipmentDesignSchema = z.object({
  unit_id: z.string().min(1, 'Process unit is required.'),
  equipment_id: z.string().min(1, 'Equipment is required.'),
  equipment_tag: z.string().min(1, 'Equipment tag is required.'),
  equipment_name: z.string().min(1, 'Equipment name is required.'),
  equipment_type: z.string().min(1, 'Equipment type is required.'),
  equipment_criticality: z.string().min(1, 'Equipment criticality is required.'),
  service_fluid: z.string().optional().nullable(),
  fluid_phase: z.string().optional().nullable(),
  design_pressure: optionalNumber,
  max_design_temperature: optionalNumber,
  material_of_construction: z.string().optional().nullable(),
  corrosion_allowance: optionalNumber,
  design_code: z.string().optional().nullable()
}).refine((value) => value.equipment_criticality !== 'Critical' || Boolean(value.material_of_construction), { message: 'Critical equipment requires material of construction or an approved unavailable reason.', path: ['material_of_construction'] });
