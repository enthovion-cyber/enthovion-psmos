import { z } from 'zod';

export const createPsmElementSnapshotSchema = z.object({
  snapshotTitle: z.string().min(1, 'Snapshot title is required').max(200),
  scopeType: z.enum(['company', 'site', 'unit']).default('company'),
  siteId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  elementId: z.string().optional().nullable(),
});

export const archivePsmElementSnapshotSchema = z.object({
  reason: z.string().min(3, 'Archive reason is required').max(500),
});
