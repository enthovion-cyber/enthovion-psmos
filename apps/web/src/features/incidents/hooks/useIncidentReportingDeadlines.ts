import { useIncidentNotificationsReporting } from './useIncidentNotificationsReporting';
export function useIncidentReportingDeadlines(id: string) { const query = useIncidentNotificationsReporting(id); return { ...query, data: query.data?.deadlines }; }
