import { incidentDetailService } from './incident-detail.service';
export const incidentReportReviewService = { request: incidentDetailService.requestFinalReportReview, approve: incidentDetailService.approveFinalReportReview, reject: incidentDetailService.rejectFinalReportReview };
