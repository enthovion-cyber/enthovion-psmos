import { z } from 'zod';

export const psmModuleMappingSchema = z.object({
  element_id: z.string().min(1, 'Element ID is required'),
  source_module: z.string().min(2, 'Source module is required'),
  source_module_label: z.string().min(2, 'Source module label is required'),
  mapping_type: z.string().default('Health Score'),
  weight: z.number().min(0).max(100).optional().nullable(),
  required_for_score: z.boolean().default(false),
  required_permission: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const psmKpiMappingSchema = z.object({
  element_id: z.string().min(1, 'Element ID is required'),
  kpi_code: z.string().min(2, 'KPI code is required'),
  source_module: z.string().optional().nullable(),
  contribution_type: z.string().default('Direct Weight'),
  weight: z.number().min(0).max(100).optional().nullable(),
  required_for_score: z.boolean().default(false),
});
