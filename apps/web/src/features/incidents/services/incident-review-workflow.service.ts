import { incidentReviewApprovalService } from './incident-review-approval.service';
export const incidentReviewWorkflowService = { start: incidentReviewApprovalService.startWorkflow, runReadiness: incidentReviewApprovalService.runReadinessCheck };
