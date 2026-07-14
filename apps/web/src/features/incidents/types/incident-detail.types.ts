export type IncidentDetailData = {
  header: any;
  statusBar: any;
  tabs: { tabs: IncidentDetailTab[] };
  overview: IncidentOverviewData;
  quickActions: any[];
  permissions: Record<string, boolean>;
  generatedAt: string;
};

export type IncidentDetailTab = {
  key: string;
  label: string;
  status: string;
  implemented: boolean;
  restricted?: boolean;
  blocker?: boolean;
  href: string;
};

export type IncidentOverviewData = {
  restricted?: boolean;
  header: any;
  summaryCards: Array<{ label: string; value: any; tone?: string; help?: string }>;
  eventSnapshot?: any;
  severityRisk?: any;
  psmClassification?: any;
  investigationReadiness?: any;
  peopleSnapshot?: any;
  assetChemicalSnapshot?: any;
  immediateActionsSnapshot?: any;
  rcaBarrierSnapshot?: any;
  capaSnapshot?: any;
  linkedPsmRecordsSnapshot?: any;
  evidenceSnapshot?: any;
  regulatoryNotificationSnapshot?: any;
  lessonsLearnedSnapshot?: any;
  recentActivity?: any[];
  blockersNextSteps?: any;
  quickLinks?: any[];
  charts?: Record<string, any>;
  generatedAt?: string;
};
