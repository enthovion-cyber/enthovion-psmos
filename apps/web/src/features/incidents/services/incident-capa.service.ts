import { incidentDetailService } from './incident-detail.service';

export const incidentCapaService = {
  tab: incidentDetailService.capa,
  create: incidentDetailService.createCapa,
  update: incidentDetailService.updateCapa,
  delete: incidentDetailService.deleteCapa,
  generateFromRca: incidentDetailService.generateCapaFromRca,
  generateFromBarriers: incidentDetailService.generateCapaFromBarriers,
  linkSource: incidentDetailService.linkCapaSource,
  linkEvidence: incidentDetailService.linkCapaEvidence,
  submitCompletion: incidentDetailService.submitCapaCompletion,
  acceptEvidence: incidentDetailService.acceptCapaEvidence,
  rejectEvidence: incidentDetailService.rejectCapaEvidence,
  verifyEffectiveness: incidentDetailService.verifyCapaEffectiveness,
  requestRework: incidentDetailService.requestCapaRework,
  escalate: incidentDetailService.escalateCapa,
  linkExistingAction: incidentDetailService.linkExistingCapaAction,
  requestReview: incidentDetailService.requestCapaReview,
  approveReview: incidentDetailService.approveCapaReview,
  rejectReview: incidentDetailService.rejectCapaReview,
  export: incidentDetailService.exportCapa
};
