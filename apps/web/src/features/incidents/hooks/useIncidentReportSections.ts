import { useIncidentFinalReport } from './useIncidentFinalReport';
export function useIncidentReportSections(id: string) { const q = useIncidentFinalReport(id); return { ...q, data: q.data?.sectionBuilder }; }
