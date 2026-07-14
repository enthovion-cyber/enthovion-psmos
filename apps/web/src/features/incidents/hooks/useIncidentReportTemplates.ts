import { useIncidentFinalReport } from './useIncidentFinalReport';
export function useIncidentReportTemplates(id: string) { const q = useIncidentFinalReport(id); return { ...q, data: q.data?.templates }; }
