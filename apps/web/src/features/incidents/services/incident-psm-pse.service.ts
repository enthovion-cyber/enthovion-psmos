import { incidentDetailService } from './incident-detail.service';

export const incidentPsmPseService = {
  get: incidentDetailService.eventDetails,
  update: incidentDetailService.updateEventDetails
};
