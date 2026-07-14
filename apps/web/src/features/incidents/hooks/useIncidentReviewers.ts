import { useIncidentReviewApproval } from './useIncidentReviewApproval';
export function useIncidentReviewers(id: string) { const query = useIncidentReviewApproval(id); return { ...query, data: query.data?.reviewers }; }
