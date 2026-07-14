import { useIncidentFinalReport } from './useIncidentFinalReport';
export function useIncidentFinalReportSummary(id: string) { const q = useIncidentFinalReport(id); return { ...q, data: q.data?.summaryCards }; }
