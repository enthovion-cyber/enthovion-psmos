import { useIncidentReviewApproval } from './useIncidentReviewApproval';
export function useIncidentReviewReadiness(id: string) { const query = useIncidentReviewApproval(id); return { ...query, data: query.data?.readiness }; }
