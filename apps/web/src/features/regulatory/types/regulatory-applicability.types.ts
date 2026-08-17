export type RegulatoryRow = Record<string, any>;

export type RegulatoryList<T = RegulatoryRow> = {
  rows: T[];
  allRows?: T[];
  total?: number;
  page?: number;
  limit?: number;
  summary?: RegulatoryRow;
};

export type RegulatoryApplicabilityAssessmentDetail = {
  assessment: RegulatoryRow;
  answers: RegulatoryRow[];
  scopeLinks: RegulatoryRow[];
  decisions: RegulatoryRow[];
  gaps: RegulatoryRow[];
  history: RegulatoryRow[];
  readiness?: RegulatoryRow;
};

export type RegulatoryApplicabilityDashboard = {
  summary: RegulatoryRow;
  byStatus: RegulatoryRow[];
  byAssessmentStatus: RegulatoryRow[];
  byJurisdiction: RegulatoryRow[];
  staleAssessments: RegulatoryRow[];
  missingRationale: RegulatoryRow[];
  openGaps: RegulatoryRow[];
};

export type RegulatoryApplicabilityMatrix = {
  rows: RegulatoryRow[];
  total: number;
  views: string[];
};
