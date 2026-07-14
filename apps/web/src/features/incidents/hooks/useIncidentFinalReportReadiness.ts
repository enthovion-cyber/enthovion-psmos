import { useIncidentFinalReport } from './useIncidentFinalReport';
export function useIncidentFinalReportReadiness(id: string) { const q = useIncidentFinalReport(id); return { ...q, data: q.data?.readiness }; }
