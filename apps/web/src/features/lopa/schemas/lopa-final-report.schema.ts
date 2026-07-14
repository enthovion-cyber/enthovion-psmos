import { z } from 'zod';
export const lopaFinalReportGenerateSchema = z.object({
  templateId: z.string().optional(),
  reportType: z.string().optional(),
  outputFormat: z.string().optional(),
  official: z.boolean().optional(),
  draft: z.boolean().optional(),
  redacted: z.boolean().optional(),
  includeAppendices: z.boolean().optional(),
  includeAttachmentsIndex: z.boolean().optional(),
  includeFullHistory: z.boolean().optional(),
  includeSignatures: z.boolean().optional(),
  includeApprovalSnapshot: z.boolean().optional(),
  includeRestrictedData: z.boolean().optional(),
  redactionMode: z.string().optional(),
  watermark: z.string().optional(),
  fileName: z.string().optional(),
  classification: z.string().optional(),
  notes: z.string().optional(),
  sectionKeys: z.array(z.string()).optional(),
  options: z.record(z.unknown()).optional()
});
export const lopaFinalReportFilterSchema = z.record(z.string().optional());
