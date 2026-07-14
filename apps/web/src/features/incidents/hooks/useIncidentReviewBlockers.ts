import { useIncidentReviewApproval } from './useIncidentReviewApproval';
export function useIncidentReviewBlockers(id: string) { const query = useIncidentReviewApproval(id); return { ...query, data: query.data?.blockers }; }
