export type IncidentFilters = Record<string, string | number | boolean | undefined>;
export type IncidentDashboardData = {
  header: any;
  summary: { cards: Record<string, number>; generatedAt: string };
  attention: { items: any[]; total: number };
  psmEvents: { summary: Record<string, number>; items: any[] };
  highPotential: { summary: Record<string, number>; items: any[] };
  investigationStatus: { summary: Record<string, any>; statuses: any[]; quickFilters: string[] };
  actionSnapshot: { summary: Record<string, number>; items: any[] };
  trends: Record<string, any>;
  register: { rows: any[]; page: number; limit: number; total: number; hasMore: boolean; sort: any };
  filterContext: Record<string, any>;
  savedViews: any[];
  permissions: Record<string, boolean>;
  generatedAt: string;
};
