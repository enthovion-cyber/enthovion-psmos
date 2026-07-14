import { z } from 'zod';

export const contextSwitchSchema = z.object({
  companyId: z.string().min(1).optional(),
  siteId: z.string().min(1).nullable().optional()
});

export type ContextSwitchInput = z.infer<typeof contextSwitchSchema>;
