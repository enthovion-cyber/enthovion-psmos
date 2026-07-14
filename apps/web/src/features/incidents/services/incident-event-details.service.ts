import { incidentDetailService } from './incident-detail.service';

export const incidentEventDetailsService = {
  get: incidentDetailService.eventDetails,
  update: incidentDetailService.updateEventDetails
};
