import { z } from 'zod';

export const psmElementCategorySchema = z.enum([
  'Information',
  'Hazard Analysis',
  'Operations',
  'People',
  'Integrity',
  'Governance',
  'Compliance',
  'Custom',
]);

export const psmElementStatusSchema = z.enum([
  'Healthy',
  'Monitor',
  'Attention Required',
  'High Risk',
  'Critical',
  'Incomplete Data',
  'Insufficient Data',
  'Restricted',
  'Source Unavailable',
  'Not Configured',
]);

export const createPsmElementSchema = z.object({
  element_code: z.string().min(2).max(50).regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric and underscores'),
  element_name: z.string().min(3).max(120),
  element_description: z.string().max(500).optional().nullable(),
  element_category: psmElementCategorySchema,
  display_order: z.number().int().min(0).default(0),
  required_foundation: z.boolean().default(false),
  notes: z.string().max(1000).optional().nullable(),
});

export const updatePsmElementSchema = createPsmElementSchema.partial();

export const archivePsmElementSchema = z.object({
  reason: z.string().min(3, 'Archive reason is required').max(500),
});
