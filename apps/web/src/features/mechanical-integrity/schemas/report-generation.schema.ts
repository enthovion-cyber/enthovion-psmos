import { z } from 'zod';

export const reportGenerationSchema = z.object({
  reportTitle: z.string().optional(),
  reportCategory: z.string().min(1),
  reportType: z.string().min(1),
  outputFormat: z.string().min(1),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  includeSummaryCharts: z.boolean().optional(),
  includeDetailTables: z.boolean().optional(),
  includeLinkedRecords: z.boolean().optional(),
  includeDocuments: z.boolean().optional(),
  includeAuditHistory: z.boolean().optional()
});
