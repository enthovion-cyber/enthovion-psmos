import { incidentReviewApprovalService } from './incident-review-approval.service';
export const incidentChangeRequestsService = { create: incidentReviewApprovalService.createChangeRequest, update: incidentReviewApprovalService.updateChangeRequest, resolve: incidentReviewApprovalService.resolveChangeRequest };
