import type { PsiUnit, PsiUnitRegistryResponse } from './psi-unit.types';

export type PsiDashboardResponse = {
  header: {
    title: string;
    subtitle: string;
    activeSiteId?: string | null;
    canCreate: boolean;
    lastUpdated: string;
  };
  summary: Record<string, number>;
  completenessPanel: { score: number; status: string; totalUnits: number };
  missingCritical: PsiUnit[];
  reviewOverdue: PsiUnit[];
  mocUpdatesRequired: PsiUnit[];
  pssrBlockers: PsiUnit[];
  recent: PsiUnit[];
  registry: PsiUnitRegistryResponse;
  savedViews: string[];
};
