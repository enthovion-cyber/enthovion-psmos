import { incidentDetailService } from './incident-detail.service';

export const incidentImmediateActionsService = {
  tab: incidentDetailService.immediateActions,
  updateSiteSafety: incidentDetailService.updateImmediateSiteSafety,
  updateRestartControl: incidentDetailService.updateImmediateRestartControl,
  create: incidentDetailService.createImmediateAction,
  update: incidentDetailService.updateImmediateAction,
  remove: incidentDetailService.deleteImmediateAction,
  convertCapa: incidentDetailService.convertImmediateActionToCapa,
  complete: incidentDetailService.completeImmediateAction,
  verify: incidentDetailService.verifyImmediateAction,
  rejectVerification: incidentDetailService.rejectImmediateActionVerification,
  linkEvidence: incidentDetailService.linkImmediateActionEvidence,
  linkCapa: incidentDetailService.linkImmediateActionCapa,
  cancel: incidentDetailService.cancelImmediateAction,
  createFollowup: incidentDetailService.createImmediateActionFollowup,
  requestReview: incidentDetailService.requestImmediateActionsReview,
  approveReview: incidentDetailService.approveImmediateActionsReview,
  rejectReview: incidentDetailService.rejectImmediateActionsReview
};
