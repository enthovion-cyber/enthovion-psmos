import { useIncidentFinalReport } from './useIncidentFinalReport';
export function useIncidentFinalReportReview(id: string) { const q = useIncidentFinalReport(id); return { ...q, data: q.data?.review }; }
