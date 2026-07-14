import { z } from 'zod';
export const incidentRegulatoryReportSchema = z.object({ reportType: z.string().min(1), requiredStatus: z.string().optional(), deadlineAt: z.string().optional() }).passthrough();
