export type ExecutiveScope = {
  siteId: string | null;
  unitId: string | null;
  areaId: string | null;
  equipmentId: string | null;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
};

export type ExecutiveAdapterStatus = 'connected' | 'connected_with_warnings' | 'unavailable' | 'permission_restricted' | 'no_data' | 'error';
export type ExecutiveModuleHealthStatus = 'healthy' | 'monitor' | 'attention_required' | 'high_risk' | 'critical' | 'incomplete_data' | 'restricted' | 'unavailable';

export type ExecutiveModuleAdapterResult = {
  moduleKey: string;
  moduleLabel: string;
  companyId: string;
  siteId: string | null;
  unitId: string | null;
  dateRange: { start: string | null; end: string | null };
  adapterStatus: ExecutiveAdapterStatus;
  moduleHealthStatus: ExecutiveModuleHealthStatus;
  healthScoreFoundation: number | null;
  metrics: Array<{ metricCode: string; metricTitle: string; value: number | null; textValue: string | null; unit: string | null; numerator: number | null; denominator: number | null; status: string; thresholdStatus: string | null; confidenceStatus: string | null; sourceCount: number; restrictedCount: number; excludedCount: number; warnings: string[] }>;
  criticalItems: ExecutiveSourceItem[];
  overdueItems: ExecutiveOverdueItem[];
  pendingApprovals: ExecutivePendingApproval[];
  staleRecords: ExecutiveStaleRecord[];
  sourceTrace: ExecutiveSourceTrace[];
  warnings: string[];
  errors: Array<{ code: string; safeMessage: string; source: string | null }>;
  calculatedAt: string;
  durationMs: number;
};

export type ExecutiveSourceItem = { sourceRecordId: string; sourceRecordType: string; title: string; severity: 'low' | 'medium' | 'high' | 'critical'; criticality: string | null; status: string | null; ownerUserId: string | null; dueDate: string | null; ageDays: number | null; siteId: string | null; unitId: string | null; drilldownRoute: string | null; restricted: boolean; safePlaceholder: boolean };
export type ExecutiveOverdueItem = { sourceRecordId: string; sourceRecordType: string; title: string; dueDate: string; overdueDays: number; ownerUserId: string | null; severity: string | null; drilldownRoute: string | null; restricted: boolean };
export type ExecutivePendingApproval = { sourceRecordId: string; sourceRecordType: string; title: string; currentStage: string | null; reviewerUserId: string | null; dueDate: string | null; slaStatus: string | null; drilldownRoute: string | null; restricted: boolean };
export type ExecutiveStaleRecord = { sourceRecordId: string; sourceRecordType: string; title: string; staleReason: string; staleSince: string | null; drilldownRoute: string | null; restricted: boolean };
export type ExecutiveSourceTrace = { metricCode: string; sourceModule: string; sourceRecordType: string; sourceRecordId: string; included: boolean; excludedReason: string | null; restricted: boolean; contribution: number | null; snapshot: Record<string, unknown> | null };
