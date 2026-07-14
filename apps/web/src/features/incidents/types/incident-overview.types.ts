import type { IncidentOverviewCharts } from './incident-overview-chart.types';
import type { IncidentReadiness } from './incident-readiness.types';

export type IncidentOverviewSummaryCard = {
  label: string;
  value: unknown;
  tone?: string;
  help?: string;
};

export type IncidentOverview = {
  restricted?: boolean;
  header?: Record<string, any>;
  summaryCards?: IncidentOverviewSummaryCard[];
  eventSnapshot?: Record<string, any>;
  severityRisk?: Record<string, any>;
  psmClassification?: Record<string, any>;
  investigationReadiness?: IncidentReadiness;
  peopleSnapshot?: Record<string, any>;
  assetChemicalSnapshot?: Record<string, any>;
  immediateActionsSnapshot?: Record<string, any>;
  rcaBarrierSnapshot?: Record<string, any>;
  capaSnapshot?: Record<string, any>;
  linkedPsmRecordsSnapshot?: Record<string, any>;
  evidenceSnapshot?: Record<string, any>;
  regulatoryNotificationSnapshot?: Record<string, any>;
  lessonsLearnedSnapshot?: Record<string, any>;
  recentActivity?: Record<string, any>[];
  blockersNextSteps?: { blockers?: Record<string, any>[]; nextSteps?: Record<string, any>[] };
  quickLinks?: Record<string, any>[];
  charts?: IncidentOverviewCharts;
  generatedAt?: string;
};
