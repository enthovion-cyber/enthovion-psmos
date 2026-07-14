import { z } from 'zod';
export const incidentTeamRaciSchema = z.object({ raciRole: z.string().optional(), responsibility: z.string().optional() });
