import { useIncidentFinalReport } from './useIncidentFinalReport';
export function useIncidentGeneratedReports(id: string) { const q = useIncidentFinalReport(id); return { ...q, data: q.data?.generatedReports }; }
