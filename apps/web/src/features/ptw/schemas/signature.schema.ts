import { z } from 'zod';

export const signSignatureSchema = z.object({
  confirmed: z.boolean().refine(Boolean, 'Confirmation is required'),
  electronicSignature: z.string().min(1, 'Electronic signature confirmation is required'),
  comment: z.string().optional()
});

export const rejectSignatureSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
  correctionRequired: z.string().optional(),
  comment: z.string().optional()
});

export const signatureRequirementSchema = z.object({
  permitType: z.string().optional(),
  riskLevel: z.string().optional(),
  areaClassification: z.string().optional(),
  equipmentCriticality: z.string().optional(),
  signatureRole: z.string().min(1, 'Signature role is required'),
  signaturePurpose: z.string().min(1, 'Signature purpose is required'),
  requiredForStatus: z.string().min(1, 'Required lifecycle status is required'),
  assignedRoleId: z.string().optional(),
  isRequired: z.boolean().default(true),
  conditionRule: z.record(z.unknown()).optional(),
  expiresOnExtension: z.boolean().default(false),
  requiresRevalidation: z.boolean().default(false)
});

export type SignSignatureValues = z.infer<typeof signSignatureSchema>;
export type RejectSignatureValues = z.infer<typeof rejectSignatureSchema>;
export type SignatureRequirementValues = z.infer<typeof signatureRequirementSchema>;
