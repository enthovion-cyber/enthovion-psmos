export type RegulatoryAuditMappingRow = Record<string, any> & {
  id: string;
  mapping_code?: string;
  mapping_title?: string;
  mapping_type?: string;
  mapping_status?: string;
  coverage_status?: string;
  verification_status?: string;
  audit_readiness_status?: string;
  stale_status?: string;
  audit_target_type?: string;
  regulatory_source_type?: string;
  restricted?: boolean;
  restrictedReason?: string;
};

export type RegulatoryAuditMappingGap = Record<string, any> & {
  id: string;
  gap_code?: string;
  gap_title?: string;
  gap_type?: string;
  gap_status?: string;
  gap_severity?: string;
};

export type RegulatoryAuditMappingRegister = {
  rows?: RegulatoryAuditMappingRow[];
  allRows?: RegulatoryAuditMappingRow[];
  total?: number;
  page?: number;
  limit?: number;
  summary?: Record<string, any>;
};

export type RegulatoryAuditMappingDashboard = {
  header?: Record<string, any>;
  summary?: Record<string, any>;
  rows?: RegulatoryAuditMappingRow[];
  recent?: RegulatoryAuditMappingRow[];
  gaps?: { rows?: RegulatoryAuditMappingGap[]; summary?: Record<string, any> };
  history?: { rows?: Record<string, any>[]; summary?: Record<string, any> };
  [key: string]: any;
};

export type RegulatoryAuditMappingDetail = {
  mapping?: RegulatoryAuditMappingRow;
  links?: { rows?: Record<string, any>[]; summary?: Record<string, any> };
  coverage?: { rows?: Record<string, any>[]; summary?: Record<string, any> };
  traceability?: { rows?: Record<string, any>[]; summary?: Record<string, any> };
  gaps?: { rows?: RegulatoryAuditMappingGap[]; summary?: Record<string, any> };
  reviews?: { rows?: Record<string, any>[]; summary?: Record<string, any> };
  history?: { rows?: Record<string, any>[]; summary?: Record<string, any> };
  readOnly?: boolean;
  readOnlyReason?: string;
  [key: string]: any;
};

export type RegulatoryAuditMappingLookups = {
  auditMappingTypes: string[];
  auditMappingSourceTypes: string[];
  auditTargetTypes: string[];
  auditMappingStatuses: string[];
  auditCoverageStatuses: string[];
  auditVerificationStatuses: string[];
  auditMappingGapTypes: string[];
  auditMappingStaleStatuses: string[];
};
