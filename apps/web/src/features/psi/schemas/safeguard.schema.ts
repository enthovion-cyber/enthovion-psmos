import { z } from 'zod';

export const safeguardSchema = z.object({
  safeguard_title: z.string().min(1, 'Safeguard title is required.'),
  unit_id: z.string().min(1, 'Process unit is required.'),
  safeguard_type: z.string().min(1, 'Safeguard type is required.'),
  function_type: z.string().min(1, 'Function type is required.'),
  criticality: z.string().min(1, 'Criticality is required.'),
  safeguard_category: z.string().optional(),
  owner_user_id: z.string().optional().nullable(),
  safety_critical: z.boolean().optional(),
  psm_critical: z.boolean().optional(),
  ipl_candidate: z.boolean().optional()
}).passthrough().superRefine((value, ctx) => {
  if ((value.safety_critical || value.psm_critical || value.criticality === 'Critical') && !value.owner_user_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['owner_user_id'], message: 'Critical safeguard requires an owner.' });
  }
});
