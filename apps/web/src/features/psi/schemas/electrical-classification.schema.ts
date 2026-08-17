import { z } from 'zod';

export const electricalClassificationSchema = z.object({
  classification_title: z.string().min(1, 'Classification title is required.'),
  unit_id: z.string().min(1, 'Process unit is required.'),
  classification_system: z.string().min(1, 'Classification system is required.'),
  building_location: z.string().optional().nullable(),
  area_id: z.string().optional().nullable(),
  applicable_standard: z.string().optional().nullable(),
  critical_area: z.boolean().optional(),
  owner_user_id: z.string().optional().nullable()
}).passthrough().superRefine((value, ctx) => {
  if (!value.area_id && !value.building_location) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Area or building/location is required.', path: ['building_location'] });
  if (value.critical_area && !value.owner_user_id) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Critical area requires an owner.', path: ['owner_user_id'] });
});
