import { incidentInvestigationTeamService } from './incident-investigation-team.service';

export const incidentTeamRequiredRolesService = {
  tab: incidentInvestigationTeamService.tab,
  generateRoles: incidentInvestigationTeamService.generateRoles
};
