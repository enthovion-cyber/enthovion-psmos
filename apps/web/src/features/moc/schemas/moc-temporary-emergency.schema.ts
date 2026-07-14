import { z } from 'zod';

export const temporaryControlSchema = z.object({
  expiryDate: z.string().optional(),
  maxDurationDays: z.coerce.number().optional(),
  reason: z.string().optional(),
  riskControls: z.string().optional(),
  reversalPlan: z.string().optional(),
  responsibleOwnerId: z.string().optional(),
  reviewFrequency: z.string().optional(),
  temporaryOperatingLimits: z.string().optional(),
  temporaryProcedureReference: z.string().optional(),
  removalVerificationRequired: z.boolean().optional()
});

export const emergencyControlSchema = z.object({
  emergencyJustification: z.string().optional(),
  bypassReason: z.string().optional(),
  immediateControls: z.string().optional(),
  implementedBy: z.string().optional(),
  implementedAt: z.string().optional(),
  affectedEquipmentArea: z.string().optional(),
  initialApprovalAuthorityId: z.string().optional(),
  reviewDueAt: z.string().optional(),
  reviewOwnerId: z.string().optional(),
  permanentMocRequired: z.boolean().optional()
});
