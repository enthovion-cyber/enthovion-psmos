import { useIncidentFinalReport } from './useIncidentFinalReport';
export function useIncidentReportPreview(id: string) { const q = useIncidentFinalReport(id); return { ...q, data: q.data?.preview }; }
