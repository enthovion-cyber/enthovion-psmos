import { z } from 'zod';

export const executiveScopeTypeSchema = z.enum([
  'company',
  'site',
  'department',
  'unit',
  'area',
  'equipment',
]);

export const executivePerformanceStatusSchema = z.enum([
  'Healthy',
  'Good',
  'Monitor',
  'Warning',
  'Attention Required',
  'High Risk',
  'Critical',
  'Insufficient Data',
  'Unavailable',
  'Restricted',
]);

export const executivePerformanceRecalculateSchema = z.object({
  scopeType: executiveScopeTypeSchema.optional(),
  scopeId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  forceRefresh: z.boolean().optional(),
});

export const executivePerformanceComparisonSchema = z.object({
  scopeType: executiveScopeTypeSchema,
  comparisonType: z.string().optional(),
  comparisonTitle: z.string().min(1).max(200).optional(),
  scopeIds: z.array(z.string()).optional(),
  dateRangeStart: z.string().optional(),
  dateRangeEnd: z.string().optional(),
});

export const executivePerformanceHeatmapQuerySchema = z.object({
  scopeType: executiveScopeTypeSchema.optional(),
  siteId: z.string().optional(),
  maxRows: z.number().int().positive().max(500).optional(),
});

export const executivePerformanceRankingQuerySchema = z.object({
  scopeType: executiveScopeTypeSchema.optional(),
  rankingType: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
});
