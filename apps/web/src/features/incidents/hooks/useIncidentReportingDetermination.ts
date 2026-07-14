import { useIncidentNotificationsReporting } from './useIncidentNotificationsReporting';
export function useIncidentReportingDetermination(id: string) { const query = useIncidentNotificationsReporting(id); return { ...query, data: query.data?.determination }; }
