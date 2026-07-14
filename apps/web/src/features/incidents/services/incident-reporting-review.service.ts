import { incidentNotificationsReportingService } from './incident-notifications-reporting.service';
export const incidentReportingReviewService = { request: incidentNotificationsReportingService.requestReview, approve: incidentNotificationsReportingService.approveReview, reject: incidentNotificationsReportingService.rejectReview };
