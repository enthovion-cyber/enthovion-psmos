import { z } from 'zod';
import { executiveScopeTypeSchema } from './executive-performance.schema';

export const createPerformanceSnapshotSchema = z.object({
  snapshotTitle: z.string().min(1, 'Snapshot title is required').max(200),
  scopeType: executiveScopeTypeSchema.default('company'),
  scopeId: z.string().optional().nullable(),
  siteId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  areaId: z.string().optional().nullable(),
  equipmentId: z.string().optional().nullable(),
  aggregationRunId: z.string().uuid().optional().nullable(),
  dateRangeStart: z.string().optional().nullable(),
  dateRangeEnd: z.string().optional().nullable(),
});

export const archivePerformanceSnapshotSchema = z.object({
  archiveReason: z.string().min(3, 'Archive reason is required').max(500),
});

export type CreatePerformanceSnapshotInput = z.infer<typeof createPerformanceSnapshotSchema>;
export type ArchivePerformanceSnapshotInput = z.infer<typeof archivePerformanceSnapshotSchema>;
