import { z } from 'zod';

export const drawingSchema = z.object({
  drawing_number: z.string().min(1, 'Drawing number is required.'),
  drawing_title: z.string().min(1, 'Drawing title is required.'),
  drawing_type: z.string().min(1, 'Drawing type is required.'),
  discipline: z.string().min(1, 'Discipline is required.'),
  unit_id: z.string().optional().nullable(),
  site_id: z.string().optional().nullable(),
  area_id: z.string().optional().nullable(),
  system_service: z.string().optional().nullable(),
  drawing_package: z.string().optional().nullable(),
  sheet_number: z.string().optional().nullable(),
  total_sheets: z.coerce.number().optional().nullable(),
  drawing_scale: z.string().optional().nullable(),
  status: z.string().optional(),
  critical_drawing: z.boolean().optional(),
  psm_critical: z.boolean().optional(),
  current_approved: z.boolean().optional(),
  owner_user_id: z.string().optional().nullable(),
  document_controller_id: z.string().optional().nullable(),
  process_engineer_id: z.string().optional().nullable(),
  discipline_engineer_id: z.string().optional().nullable(),
  operations_owner_id: z.string().optional().nullable(),
  hse_reviewer_id: z.string().optional().nullable(),
  last_review_date: z.string().optional().nullable(),
  next_review_due: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
}).superRefine((value, ctx) => {
  if (value.critical_drawing && !value.owner_user_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['owner_user_id'], message: 'Critical P&ID/PFD requires an owner.' });
  }
});
