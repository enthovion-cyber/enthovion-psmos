import { z } from 'zod';

export const lopaOverviewSummaryCardSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  tone: z.string(),
  tab: z.string().optional()
});

export const lopaOverviewSchema = z.object({
  readOnly: z.boolean(),
  summaryCards: z.array(lopaOverviewSummaryCardSchema),
  readiness: z.object({
    status: z.string(),
    complete: z.number(),
    total: z.number(),
    blocked: z.number(),
    warnings: z.number(),
    checklist: z.array(z.any())
  })
}).passthrough();
