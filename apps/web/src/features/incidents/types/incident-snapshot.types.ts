export type IncidentSnapshotRecord = Record<string, unknown>;

export type IncidentSnapshotPanelProps<T extends IncidentSnapshotRecord = IncidentSnapshotRecord> = {
  data?: T | null;
  loading?: boolean;
  error?: Error | null;
  restricted?: boolean;
  readOnly?: boolean;
};
