import { incidentDetailService } from './incident-detail.service';

export const incidentReviewService = {
  requestClassificationReview: incidentDetailService.requestClassificationReview,
  approveClassification: incidentDetailService.approveClassification,
  rejectClassification: incidentDetailService.rejectClassification,
  requestSeverityReview: incidentDetailService.requestSeverityReview,
  approveSeverityReview: incidentDetailService.approveSeverityReview,
  rejectSeverityReview: incidentDetailService.rejectSeverityReview
};
