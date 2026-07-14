import { incidentDetailService } from './incident-detail.service';

export const incidentBarriersService = {
  tab: incidentDetailService.barriers,
  create: incidentDetailService.createBarrier,
  update: incidentDetailService.updateBarrier,
  delete: incidentDetailService.deleteBarrier,
  importHazop: incidentDetailService.importBarriersFromHazop,
  importLopa: incidentDetailService.importBarriersFromLopa,
  linkEvidence: incidentDetailService.linkBarrierEvidence,
  linkRca: incidentDetailService.linkBarrierRca,
  createFollowupAction: incidentDetailService.createBarrierFollowupAction,
  requestReview: incidentDetailService.requestBarrierReview,
  approveReview: incidentDetailService.approveBarrierReview,
  rejectReview: incidentDetailService.rejectBarrierReview
};
