import { z } from 'zod';
export const incidentReportingDeterminationSchema = z.object({ reportingRequired: z.string().optional(), reason: z.string().optional() }).passthrough();
