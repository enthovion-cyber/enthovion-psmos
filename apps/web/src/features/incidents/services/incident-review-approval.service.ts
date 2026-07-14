import { incidentDetailService } from './incident-detail.service';

export const incidentReviewApprovalService = {
  tab: incidentDetailService.reviewApproval,
  runReadinessCheck: incidentDetailService.runReviewReadinessCheck,
  startWorkflow: incidentDetailService.startReviewWorkflow,
  createReviewer: incidentDetailService.createReviewReviewer,
  updateReviewer: incidentDetailService.updateReviewReviewer,
  removeReviewer: incidentDetailService.removeReviewReviewer,
  requestReviewer: incidentDetailService.requestReviewReviewer,
  approveReviewer: incidentDetailService.approveReviewReviewer,
  rejectReviewer: incidentDetailService.rejectReviewReviewer,
  requestReviewerChanges: incidentDetailService.requestReviewReviewerChanges,
  delegateReviewer: incidentDetailService.delegateReviewReviewer,
  escalateReviewer: incidentDetailService.escalateReviewReviewer,
  eSign: incidentDetailService.eSignReviewApproval,
  overrideBlocker: incidentDetailService.overrideReviewBlocker,
  createChangeRequest: incidentDetailService.createReviewChangeRequest,
  updateChangeRequest: incidentDetailService.updateReviewChangeRequest,
  resolveChangeRequest: incidentDetailService.resolveReviewChangeRequest,
  requestClosure: incidentDetailService.requestReviewClosure,
  approveClosure: incidentDetailService.approveReviewClosure,
  closeIncident: incidentDetailService.closeFromReviewApproval,
  reopenIncident: incidentDetailService.reopenFromReviewApproval
};
