import { z } from 'zod';

export const hazopLinkedRecordSchema = z.object({
  linkedModule: z.string().min(1, 'Module is required'),
  linkedRecordId: z.string().min(1, 'Record is required'),
  linkedRecordNumber: z.string().optional(),
  linkedRecordTitle: z.string().optional(),
  linkedRecordType: z.string().optional(),
  relationshipType: z.string().min(1, 'Relationship type is required'),
  dependencyDirection: z.string().min(1, 'Dependency direction is required'),
  blockingRule: z.string().optional(),
  linkReason: z.string().optional(),
  notes: z.string().optional()
});
