import { incidentReviewApprovalService } from './incident-review-approval.service';
export const incidentClosureService = { request: incidentReviewApprovalService.requestClosure, approve: incidentReviewApprovalService.approveClosure, close: incidentReviewApprovalService.closeIncident, reopen: incidentReviewApprovalService.reopenIncident };
