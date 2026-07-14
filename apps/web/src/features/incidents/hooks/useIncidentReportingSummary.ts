import { useIncidentNotificationsReporting } from './useIncidentNotificationsReporting';
export function useIncidentReportingSummary(id: string) { const query = useIncidentNotificationsReporting(id); return { ...query, data: query.data?.summaryCards }; }
