export type MiHistoryEvent = {
  id: string;
  sourceTable?: string;
  companyId?: string;
  siteId?: string | null;
  equipmentId?: string | null;
  sourceModule: string;
  sourceRecordId?: string | null;
  sourceRecordNumber?: string | null;
  eventType: string;
  eventTitle: string;
  eventDescription?: string | null;
  eventAt: string;
  actorUserId?: string | null;
  severity: string;
  readinessImpact: boolean;
  startupImpact: boolean;
  beforeAfterAvailable: boolean;
  beforeValues?: unknown;
  afterValues?: unknown;
  linkedRecords?: unknown[];
  auditLogId?: string | null;
};

export type MiHistoryDashboard = {
  rows: MiHistoryEvent[];
  page: number;
  limit: number;
  total: number;
  summary: Record<string, number>;
  recentCriticalEvents: MiHistoryEvent[];
  approvalHistory: MiHistoryEvent[];
  exportHistory: MiHistoryEvent[];
  savedViews: string[];
  lastUpdated: string;
};

export type MiEquipmentHistory = {
  equipment: Record<string, unknown>;
  rows: MiHistoryEvent[];
  summary: Record<string, number>;
  lifecycleTimeline: MiHistoryEvent[];
  integrityEvents: MiHistoryEvent[];
  inspectionCmlTimeline: MiHistoryEvent[];
  pmCalibrationTimeline: MiHistoryEvent[];
  psvSifSafeguardTimeline: MiHistoryEvent[];
  deficiencyWorkTimeline: MiHistoryEvent[];
  readinessApprovalTimeline: MiHistoryEvent[];
  documentTimeline: MiHistoryEvent[];
  lastUpdated: string;
};
