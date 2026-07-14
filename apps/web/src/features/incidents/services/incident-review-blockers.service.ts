import { incidentReviewApprovalService } from './incident-review-approval.service';
export const incidentReviewBlockersService = { override: incidentReviewApprovalService.overrideBlocker };
