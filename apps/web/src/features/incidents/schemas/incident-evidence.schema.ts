import { z } from 'zod';
export const incidentEvidenceSchema = z.object({ evidenceType: z.string().optional(), fileName: z.string().optional(), classification: z.string().optional() });
