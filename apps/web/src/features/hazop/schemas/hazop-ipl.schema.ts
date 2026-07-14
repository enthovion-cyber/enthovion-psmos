import { z } from 'zod';

export const hazopIplValidationItemSchema = z.object({
  criterion_key: z.string(),
  criterion_label: z.string(),
  required: z.boolean().default(true),
  result: z.enum(['Pass', 'Fail', 'Not Applicable', 'Needs Evidence']).default('Not Applicable'),
  comment: z.string().optional(),
  evidenceAttachmentId: z.string().optional()
});

export const hazopIplValidationSchema = z.object({
  validationSummary: z.string().optional(),
  items: z.array(hazopIplValidationItemSchema).min(1)
});

export type HazopIplValidationInput = z.infer<typeof hazopIplValidationSchema>;
