import { incidentDetailService } from './incident-detail.service';

export const incidentRcaService = {
  tab: incidentDetailService.rca,
  updateMethod: incidentDetailService.updateRcaMethod,
  createCausalFactor: incidentDetailService.createRcaCausalFactor,
  updateCausalFactor: incidentDetailService.updateRcaCausalFactor,
  deleteCausalFactor: incidentDetailService.deleteRcaCausalFactor,
  confirmCausalFactor: incidentDetailService.confirmRcaCausalFactor,
  rejectCausalFactor: incidentDetailService.rejectRcaCausalFactor,
  linkCausalFactorEvidence: incidentDetailService.linkRcaCausalFactorEvidence,
  convertFactorToRootCause: incidentDetailService.convertRcaFactorToRootCause,
  createRootCause: incidentDetailService.createRcaRootCause,
  updateRootCause: incidentDetailService.updateRcaRootCause,
  deleteRootCause: incidentDetailService.deleteRcaRootCause,
  createCapa: incidentDetailService.createRcaCapa,
  upsertFiveWhyChain: incidentDetailService.upsertRcaFiveWhyChain,
  upsertFiveWhyStep: incidentDetailService.upsertRcaFiveWhyStep,
  upsertFishboneItem: incidentDetailService.upsertRcaFishboneItem,
  upsertCauseTreeNode: incidentDetailService.upsertRcaCauseTreeNode,
  upsertCauseTreeEdge: incidentDetailService.upsertRcaCauseTreeEdge,
  upsertSystemicWeakness: incidentDetailService.upsertRcaSystemicWeakness,
  upsertHypothesis: incidentDetailService.upsertRcaHypothesis,
  requestReview: incidentDetailService.requestRcaReview,
  approveReview: incidentDetailService.approveRcaReview,
  rejectReview: incidentDetailService.rejectRcaReview,
  complete: incidentDetailService.completeRca,
  reopen: incidentDetailService.reopenRca
};
