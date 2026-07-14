import { z } from 'zod';
export const incidentRegisterFilterSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.undefined()]));
