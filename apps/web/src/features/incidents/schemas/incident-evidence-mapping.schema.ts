import { z } from 'zod';
export const incidentEvidenceMappingSchema = z.object({ mappedTab: z.string().optional(), mappedRecordType: z.string().optional(), mappedRecordId: z.string().optional() });
