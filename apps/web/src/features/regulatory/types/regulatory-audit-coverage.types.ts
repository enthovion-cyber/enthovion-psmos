export type RegulatoryAuditCoverageRecord = Record<string, any> & {
  id: string;
  mapping_id?: string;
  coverage_status?: string;
  audit_readiness_status?: string;
  coverage_score?: number;
};
