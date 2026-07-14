import { incidentInvestigationTeamService } from './incident-investigation-team.service';
export const incidentTeamNotificationsService = {
  send: incidentInvestigationTeamService.sendNotification,
  sendReminders: incidentInvestigationTeamService.sendReminders
};
