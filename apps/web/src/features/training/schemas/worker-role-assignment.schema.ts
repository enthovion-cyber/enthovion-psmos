import { z } from 'zod';
export const workerRoleAssignmentSchema = z.object({ jobRole: z.string().min(1), safetyCritical: z.boolean().default(false), ptwRoleCandidate: z.boolean().default(false) });
