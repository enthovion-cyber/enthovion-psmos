import { z } from 'zod';
export const lopaReportSectionSchema = z.object({ sectionKey: z.string(), included: z.boolean().optional(), reason: z.string().optional(), config: z.record(z.unknown()).optional() });
export const lopaReportSectionsSchema = z.object({ sections: z.array(lopaReportSectionSchema), reason: z.string().optional() });
