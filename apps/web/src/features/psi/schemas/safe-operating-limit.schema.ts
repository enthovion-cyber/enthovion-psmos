import { z } from 'zod';

export const safeOperatingLimitSchema = z.object({
  unit_id: z.string().min(1, 'Process unit is required.'),
  limit_title: z.string().min(1, 'Limit title is required.'),
  parameter_name: z.string().min(1, 'Parameter name is required.'),
  parameter_type: z.string().min(1, 'Parameter type is required.'),
  limit_scope: z.string().min(1, 'Limit scope is required.'),
  criticality: z.string().min(1, 'Criticality is required.'),
  unit_of_measure: z.string().min(1, 'Unit of measure is required.'),
  normal_min: z.coerce.number().optional().nullable(),
  normal_max: z.coerce.number().optional().nullable(),
  normal_target: z.coerce.number().optional().nullable(),
  min_safe_limit: z.coerce.number().optional().nullable(),
  max_safe_limit: z.coerce.number().optional().nullable(),
  min_design_limit: z.coerce.number().optional().nullable(),
  max_design_limit: z.coerce.number().optional().nullable()
}).refine((value) => value.normal_min !== undefined || value.normal_max !== undefined || value.normal_target !== undefined, { message: 'Normal range or target is required.', path: ['normal_target'] }).refine((value) => value.criticality !== 'Critical' || value.min_safe_limit !== undefined || value.max_safe_limit !== undefined || value.min_design_limit !== undefined || value.max_design_limit !== undefined, { message: 'Critical limits require at least one safe or design boundary.', path: ['max_safe_limit'] });
