import { z } from 'zod';

export const signElectronicSignatureSchema = z.object({
  moduleName: z.string().min(1),
  recordType: z.string().min(1),
  recordId: z.string().min(1),
  recordNumber: z.string().optional(),
  actionType: z.string().min(1),
  signatureRole: z.string().min(1),
  declarationText: z.string().optional(),
  authMethod: z.enum(['password', 'pin']),
  usernameReentry: z.string().min(2, 'Username re-entry is required'),
  passwordOrPin: z.string().min(4, 'Password or PIN is required'),
  comment: z.string().optional(),
  recordHashBeforeSigning: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const rejectElectronicSignatureSchema = z.object({
  moduleName: z.string().min(1),
  recordType: z.string().min(1),
  recordId: z.string().min(1),
  actionType: z.string().min(1),
  signatureRole: z.string().min(1),
  rejectionReason: z.string().min(5, 'Rejection reason is required')
});

export type SignElectronicSignatureFormValues = z.infer<typeof signElectronicSignatureSchema>;
export type RejectElectronicSignatureFormValues = z.infer<typeof rejectElectronicSignatureSchema>;

