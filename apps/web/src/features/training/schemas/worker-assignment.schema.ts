import { z } from 'zod';
export const workerAssignmentSchema = z.object({ siteId: z.string().min(1), unitId: z.string().optional(), areaId: z.string().optional(), assignmentStatus: z.string().default('Active') });
