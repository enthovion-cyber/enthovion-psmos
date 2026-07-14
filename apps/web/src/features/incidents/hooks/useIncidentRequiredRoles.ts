import { useIncidentInvestigationTeam } from './useIncidentInvestigationTeam';

export function useIncidentRequiredRoles(id: string) {
  const query = useIncidentInvestigationTeam(id);
  return { ...query, data: query.data?.requiredRolesMatrix };
}
