import { useIncidentPeople } from './useIncidentPeople';

export function useIncidentPeopleSummary(id: string) {
  return useIncidentPeople(id);
}
