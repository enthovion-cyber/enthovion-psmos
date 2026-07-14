import { z } from 'zod';

export const lopaSilDetermineSchema = z.object({
  targetSil: z.string().trim().optional(),
  methodologyReference: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

export const lopaSifSpecificationSchema = z.object({
  title: z.string().trim().min(1, 'SIF title is required.'),
  sifTag: z.string().trim().optional(),
  safetyFunction: z.string().trim().optional(),
  targetSil: z.string().trim().optional(),
  safeState: z.string().trim().optional(),
  tripSetpoint: z.string().trim().optional(),
  proofTestInterval: z.string().trim().optional(),
  proofTestBasis: z.string().trim().optional(),
  equipmentSystem: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  complete: z.boolean().optional()
});

export const lopaSifComponentSchema = z.object({
  componentType: z.enum(['Sensor', 'Logic Solver', 'Final Element', 'Auxiliary', 'Other']),
  componentTag: z.string().trim().optional(),
  componentName: z.string().trim().optional(),
  processVariable: z.string().trim().optional(),
  setpoint: z.string().trim().optional(),
  actionOnTrip: z.string().trim().optional(),
  failureDataReference: z.string().trim().optional(),
  proofTestRequirement: z.string().trim().optional()
});

export const lopaSilLinkSchema = z.object({
  linkedRecordType: z.string().trim().min(1),
  linkedRecordId: z.string().trim().min(1),
  linkedRecordNumber: z.string().trim().optional(),
  linkedRecordTitle: z.string().trim().optional(),
  relationship: z.string().trim().optional(),
  required: z.boolean().optional()
});
