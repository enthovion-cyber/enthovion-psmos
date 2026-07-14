import { useIncidentReviewApproval } from './useIncidentReviewApproval';
export function useIncidentClosure(id: string) { const query = useIncidentReviewApproval(id); return { ...query, data: query.data?.closure }; }
