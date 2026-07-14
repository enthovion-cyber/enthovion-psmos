import { useIncidentHistory } from './useIncidentHistory';
export function useIncidentHistoryEvents(id: string, filters: Record<string, any> = {}) { const query = useIncidentHistory(id, filters); return { ...query, data: query.data?.events }; }
