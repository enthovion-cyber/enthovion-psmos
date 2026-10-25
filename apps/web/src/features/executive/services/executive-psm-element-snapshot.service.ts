import { executivePsmElementApi } from './executive-psm-element.service';

export const executivePsmElementSnapshotService = {
  snapshots: (params?: Record<string, unknown>) => executivePsmElementApi.snapshots(params),
  snapshot: (id: string) => executivePsmElementApi.snapshot(id),
  createSnapshot: (body?: Record<string, unknown>) => executivePsmElementApi.createSnapshot(body),
  archiveSnapshot: (id: string, reason: string) => executivePsmElementApi.archiveSnapshot(id, reason),
};
