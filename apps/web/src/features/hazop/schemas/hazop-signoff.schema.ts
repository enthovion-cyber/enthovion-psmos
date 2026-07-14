import { z } from 'zod';

export const hazopSignoffSignatureSchema = z.object({
  confirmation: z.boolean(),
  eSignatureId: z.string().optional(),
  signatureSnapshot: z.any().optional(),
  comment: z.string().optional()
});

export const hazopSignoffRejectSchema = z.object({
  reason: z.string().min(3, 'Reason is required')
});
