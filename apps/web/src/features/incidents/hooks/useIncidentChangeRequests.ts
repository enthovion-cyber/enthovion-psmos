import { useIncidentReviewApproval } from './useIncidentReviewApproval';
export function useIncidentChangeRequests(id: string) { const query = useIncidentReviewApproval(id); return { ...query, data: query.data?.changeRequests }; }
