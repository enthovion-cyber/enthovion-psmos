export type RegulatoryAuditTraceabilitySnapshot = Record<string, any> & {
  id: string;
  mapping_id?: string;
  snapshot_title?: string;
  snapshot_status?: string;
  snapshot_hash?: string;
};
