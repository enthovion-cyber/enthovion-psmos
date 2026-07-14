import { incidentBarriersService } from './incident-barriers.service';

export const incidentBarrierReviewService = {
  request: incidentBarriersService.requestReview,
  approve: incidentBarriersService.approveReview,
  reject: incidentBarriersService.rejectReview
};
