import { useIncidentFinalReport } from './useIncidentFinalReport';
export function useIncidentReportExports(id: string) { const q = useIncidentFinalReport(id); return { ...q, data: q.data?.downloadLog }; }
