import { useIncidentNotificationsReporting } from './useIncidentNotificationsReporting';
export function useIncidentRegulatoryReports(id: string) { const query = useIncidentNotificationsReporting(id); return { ...query, data: query.data?.regulatoryReportsRegister }; }
