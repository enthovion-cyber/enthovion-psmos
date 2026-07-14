import { incidentNotificationsReportingService } from './incident-notifications-reporting.service';
export const incidentNotificationsService = { send: incidentNotificationsReportingService.sendNotification, resend: incidentNotificationsReportingService.resendNotification, acknowledge: incidentNotificationsReportingService.acknowledgeNotification };
