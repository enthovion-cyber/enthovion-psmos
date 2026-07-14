import { z } from 'zod';
export const incidentTeamSchema = z.object({ readinessStatus: z.string().optional() });
