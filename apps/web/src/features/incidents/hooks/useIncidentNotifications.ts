import { useIncidentNotificationsReporting } from './useIncidentNotificationsReporting';
export function useIncidentNotifications(id: string) { const query = useIncidentNotificationsReporting(id); return { ...query, data: query.data?.internalNotificationsRegister }; }
