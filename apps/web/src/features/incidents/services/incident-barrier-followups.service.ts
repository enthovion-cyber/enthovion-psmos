import { incidentBarriersService } from './incident-barriers.service';

export const incidentBarrierFollowupsService = {
  createAction: incidentBarriersService.createFollowupAction
};
