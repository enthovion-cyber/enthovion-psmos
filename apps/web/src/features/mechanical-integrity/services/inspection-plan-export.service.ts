export const inspectionPlanExportService = {
  registryUrl(params?: URLSearchParams) {
    return `/api/v1/mechanical-integrity/inspection-plans/export${params ? `?${params.toString()}` : ''}`;
  },
  planUrl(planId: string) {
    return `/api/v1/mechanical-integrity/inspection-plans/${planId}/export`;
  }
};
