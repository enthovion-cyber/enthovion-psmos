import { useIncidentNotificationsReporting } from './useIncidentNotificationsReporting';
export function useIncidentReportingReadiness(id: string) { const query = useIncidentNotificationsReporting(id); return { ...query, data: query.data?.readiness }; }
