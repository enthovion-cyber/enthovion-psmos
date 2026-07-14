import { incidentCapaService } from './incident-capa.service';

export const incidentCapaReviewService = {
  requestReview: incidentCapaService.requestReview,
  approveReview: incidentCapaService.approveReview,
  rejectReview: incidentCapaService.rejectReview
};
