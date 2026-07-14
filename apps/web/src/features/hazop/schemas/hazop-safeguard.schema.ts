import { z } from 'zod';

export const hazopSafeguardSchema = z.object({
  scenarioId: z.string().optional(),
  safeguardName: z.string().min(2, 'Safeguard name is required'),
  safeguardType: z.string().min(1, 'Safeguard type is required'),
  safeguardCategory: z.string().default('Prevention'),
  description: z.string().min(3, 'Description is required'),
  existingOrProposed: z.string().default('Existing'),
  creditedForRiskReduction: z.boolean().default(false),
  iplCandidate: z.boolean().default(false),
  equipmentId: z.string().optional(),
  documentId: z.string().optional(),
  documentVersionId: z.string().optional(),
  ownerId: z.string().optional(),
  proofTestRequired: z.boolean().default(false),
  inspectionRequired: z.boolean().default(false),
  evidenceRequired: z.boolean().default(false),
  notes: z.string().optional(),
  safetySystemType: z.string().optional(),
  sifTag: z.string().optional(),
  interlockId: z.string().optional(),
  tripSetpoint: z.string().optional(),
  finalElement: z.string().optional(),
  sensorTransmitter: z.string().optional(),
  logicSolver: z.string().optional(),
  targetSil: z.string().optional(),
  proofTestInterval: z.string().optional()
});

export const hazopSafeguardGapSchema = z.object({
  gapType: z.string().min(1),
  gapDescription: z.string().min(3),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  ownerId: z.string().optional(),
  dueDate: z.string().optional()
});

export const hazopSafeguardTestStatusSchema = z.object({
  proofTestRequired: z.boolean().optional(),
  inspectionRequired: z.boolean().optional(),
  testFrequency: z.string().optional(),
  lastTestDate: z.string().optional(),
  nextTestDueDate: z.string().optional(),
  status: z.string().optional(),
  evidenceAttachmentId: z.string().optional(),
  linkedMiRecordId: z.string().optional(),
  ownerId: z.string().optional()
});

export type HazopSafeguardInput = z.infer<typeof hazopSafeguardSchema>;
