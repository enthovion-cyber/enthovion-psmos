import { incidentDetailService } from './incident-detail.service';

export const incidentTimelineService = {
  tab: incidentDetailService.timeline,
  createEvent: incidentDetailService.createTimelineEvent,
  updateEvent: incidentDetailService.updateTimelineEvent,
  deleteEvent: incidentDetailService.deleteTimelineEvent,
  requestReview: incidentDetailService.requestTimelineReview,
  approveReview: incidentDetailService.approveTimelineReview,
  rejectReview: incidentDetailService.rejectTimelineReview
};
