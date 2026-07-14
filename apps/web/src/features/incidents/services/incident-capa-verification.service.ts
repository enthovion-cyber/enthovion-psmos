import { incidentCapaService } from './incident-capa.service';

export const incidentCapaVerificationService = {
  submitCompletion: incidentCapaService.submitCompletion,
  acceptEvidence: incidentCapaService.acceptEvidence,
  rejectEvidence: incidentCapaService.rejectEvidence,
  verifyEffectiveness: incidentCapaService.verifyEffectiveness,
  requestRework: incidentCapaService.requestRework
};
