export type IncidentOverviewChartPoint = {
  label: string;
  value?: string | number | null;
  count?: number;
};

export type IncidentOverviewCharts = {
  severityComparison?: IncidentOverviewChartPoint[];
  readiness?: IncidentOverviewChartPoint[];
  actionStatus?: IncidentOverviewChartPoint[];
  evidenceStatus?: IncidentOverviewChartPoint[];
  linkedRecords?: IncidentOverviewChartPoint[];
  blockersByCategory?: IncidentOverviewChartPoint[];
};
