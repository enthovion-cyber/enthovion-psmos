import { useIncidentInvestigationTeam } from './useIncidentInvestigationTeam';

export function useIncidentTeamNotifications(id: string) {
  const query = useIncidentInvestigationTeam(id);
  return { ...query, data: query.data?.communicationNotifications };
}
