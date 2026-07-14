import { incidentDetailService } from './incident-detail.service';

export const incidentClassificationService = {
  get: incidentDetailService.eventDetails,
  update: incidentDetailService.updateEventDetails,
  requestReview: incidentDetailService.requestClassificationReview,
  approve: incidentDetailService.approveClassification,
  reject: incidentDetailService.rejectClassification
};
