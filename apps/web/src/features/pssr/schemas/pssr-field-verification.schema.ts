import { z } from 'zod';

export const pssrFieldEvidenceSchema = z.object({
  equipmentVerificationId: z.string().optional(),
  fieldChecklistItemId: z.string().optional(),
  fileName: z.string().min(1),
  caption: z.string().optional()
});
