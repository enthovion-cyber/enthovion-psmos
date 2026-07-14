export type HazopOverviewProfile = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  title?: string | null;
  initials?: string | null;
};

export type HazopOverviewKpi = {
  key: string;
  label: string;
  value: string | number;
  helper?: string;
  tone?: string;
  tab?: string;
};

export type HazopOverviewProgressMetric = {
  key: string;
  label: string;
  done?: number;
  total?: number;
  percent: number;
  tab?: string;
};

export type HazopOverviewRiskCell = {
  severity: number;
  likelihood: number;
  count: number;
  level: string;
  color: string;
};

export type HazopOverviewData = {
  study: Record<string, any>;
  header: Record<string, any>;
  permissions: Record<string, boolean>;
  kpis: HazopOverviewKpi[];
  overview: Record<string, any>;
  progress: {
    metrics: HazopOverviewProgressMetric[];
    overallPercent: number;
    status: string;
  };
  riskSnapshot: {
    severityLevels: number[];
    likelihoodLevels: number[];
    cells: HazopOverviewRiskCell[];
    legend: Array<{ level: string; count: number; color: string }>;
    totalScenarios: number;
    highCriticalTotal: number;
    unrankedScenarios: number;
    residualRiskSummary?: Record<string, number>;
  };
  teamSnapshot: Record<string, any>;
  recommendationsPreview: { restricted?: boolean; total: number; rows: any[] };
  linkedRecordsPreview: { restricted?: boolean; total: number; openBlockers: number; outdatedDocuments: number; lopaPending: number; counts: any[] };
  recentActivity: any[];
  attachmentsPreview: { restricted?: boolean; total: number; rows: any[] };
  readiness: Record<string, any>;
  equipmentContext: { processSection?: string | null; pidReferences: string[]; equipment: any[]; diagramNodes: any[] };
  quickActions: Array<{ key: string; label: string; enabled: boolean; tab?: string | null }>;
};
