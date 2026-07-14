import { useIncidentHistory } from './useIncidentHistory';
export function useIncidentHistorySummary(id: string) { const query = useIncidentHistory(id); return { ...query, data: query.data?.summaryCards }; }
