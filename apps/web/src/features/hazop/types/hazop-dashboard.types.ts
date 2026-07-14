export type HazopDashboardFilters = {
  search: string;
  siteId: string;
  unitId: string;
  areaId: string;
  studyType: string;
  status: string;
  riskPriority: string;
  leaderId: string;
  overdue: boolean;
  lopaRequired: boolean;
  pendingSignoff: boolean;
  revalidationDue: boolean;
  dateFrom: string;
  dateTo: string;
};

export type HazopDashboardData = {
  kpis?: Record<string, number>;
  studies?: any[];
  highRiskScenarios?: any[];
  recommendationHealth?: Record<string, number>;
  revalidation?: any[];
  recentActivity?: any[];
  charts?: Record<string, any>;
};
