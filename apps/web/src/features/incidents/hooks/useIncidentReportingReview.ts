import { useIncidentNotificationsReporting } from './useIncidentNotificationsReporting';
export function useIncidentReportingReview(id: string) { const query = useIncidentNotificationsReporting(id); return { ...query, data: query.data?.review }; }
