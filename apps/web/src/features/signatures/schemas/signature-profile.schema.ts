import { z } from 'zod';

export const signatureProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  jobTitle: z.string().optional(),
  departmentId: z.string().optional(),
  departmentName: z.string().optional(),
  signatureMethod: z.enum(['Draw', 'Type', 'Upload', 'Initials']),
  signatureText: z.string().optional(),
  signatureImageKey: z.string().optional(),
  signatureImageUrl: z.string().url().optional().or(z.literal('')),
  signatureVectorJson: z.unknown().optional(),
  initials: z.string().max(6).optional(),
  styleConfig: z.record(z.string(), z.unknown()).optional()
}).superRefine((value, context) => {
  if (value.signatureMethod === 'Type' && !value.signatureText?.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Typed signature text is required', path: ['signatureText'] });
  }
  if (value.signatureMethod === 'Upload' && !value.signatureImageKey && !value.signatureImageUrl) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Signature image is required', path: ['signatureImageUrl'] });
  }
  if (value.signatureMethod === 'Initials' && !value.initials?.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Initials are required', path: ['initials'] });
  }
});

export type SignatureProfileFormValues = z.infer<typeof signatureProfileSchema>;

