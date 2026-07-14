import { incidentNotificationsReportingService } from './incident-notifications-reporting.service';
export const incidentReportingDeterminationService = { run: incidentNotificationsReportingService.runDetermination, update: incidentNotificationsReportingService.updateDetermination };
