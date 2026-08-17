import { z } from 'zod';

export const regulatoryActionLinkSchema = z.object({
  universalActionId: z.string().optional(),
  auditCapaId: z.string().optional(),
  reason: z.string().min(1, 'Reason is required.')
});
