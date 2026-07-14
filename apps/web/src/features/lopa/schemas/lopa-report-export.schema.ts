import { z } from 'zod';
export const lopaReportExportSchema = z.object({ outputFormat: z.string(), reportType: z.string().optional(), classification: z.string().optional(), notes: z.string().optional() });
