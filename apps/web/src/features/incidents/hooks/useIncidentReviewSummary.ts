import { useIncidentReviewApproval } from './useIncidentReviewApproval';
export function useIncidentReviewSummary(id: string) { const query = useIncidentReviewApproval(id); return { ...query, data: query.data?.summaryCards }; }
