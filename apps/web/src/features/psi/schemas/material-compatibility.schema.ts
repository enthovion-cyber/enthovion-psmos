import { z } from 'zod';

export const materialCompatibilitySchema = z.object({
  compatibility_title: z.string().min(1, 'Compatibility title is required.'),
  unit_id: z.string().min(1, 'Process unit is required.'),
  compatibility_scope: z.string().min(1, 'Compatibility scope is required.'),
  component_type: z.string().min(1, 'Component type is required.'),
  system_service: z.string().optional().nullable(),
  owner_user_id: z.string().optional().nullable(),
  safety_critical: z.boolean().optional(),
  chemical_id: z.string().optional().nullable(),
  equipment_id: z.string().optional().nullable(),
  chemical_name: z.string().optional().nullable(),
  material_family: z.string().optional().nullable(),
  material_grade: z.string().optional().nullable(),
  compatibility_rating: z.string().optional().nullable(),
  rating_basis: z.string().optional().nullable()
}).passthrough().superRefine((value, ctx) => {
  if (!value.chemical_id && !value.chemical_name) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Chemical or service chemical name is required.', path: ['chemical_name'] });
  if (!value.equipment_id && !value.material_family) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Equipment or material family is required.', path: ['material_family'] });
  if (value.safety_critical && !value.owner_user_id) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Safety-critical compatibility requires an owner.', path: ['owner_user_id'] });
});

export const materialServiceConditionSchema = z.object({}).passthrough();
export const materialDetailsSchema = z.object({}).passthrough();
export const compatibilityRatingSchema = z.object({}).passthrough();
export const degradationMechanismSchema = z.object({ mechanism_type: z.string().min(1, 'Degradation mechanism is required.') }).passthrough();
export const compatibilityControlsSchema = z.object({}).passthrough();

