import { z } from 'zod';

export const hazopDashboardFiltersSchema = z.object({
  search: z.string().optional(),
  siteId: z.string().optional(),
  unitId: z.string().optional(),
  areaId: z.string().optional(),
  studyType: z.string().optional(),
  status: z.string().optional(),
  riskPriority: z.string().optional(),
  leaderId: z.string().optional(),
  overdue: z.boolean().optional(),
  lopaRequired: z.boolean().optional(),
  pendingSignoff: z.boolean().optional(),
  revalidationDue: z.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});

export type HazopDashboardFiltersInput = z.infer<typeof hazopDashboardFiltersSchema>;
