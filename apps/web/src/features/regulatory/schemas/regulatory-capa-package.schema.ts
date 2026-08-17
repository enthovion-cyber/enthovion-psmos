import { z } from 'zod';

export const regulatoryCapaPackageSchema = z.object({
  capaPackageTitle: z.string().min(1, 'CAPA package title is required.'),
  capaPackageType: z.string().min(1, 'CAPA package type is required.'),
  ownerUserId: z.string().optional(),
  dueDate: z.string().optional(),
  reason: z.string().optional()
});
