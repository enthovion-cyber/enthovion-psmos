import { useIncidentReviewApproval } from './useIncidentReviewApproval';
export function useIncidentSectionChecklist(id: string) { const query = useIncidentReviewApproval(id); return { ...query, data: query.data?.sectionChecklist }; }
