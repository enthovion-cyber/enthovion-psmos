import { useIncidentPeople } from './useIncidentPeople';

export function useIncidentInjuryDetails(id: string) {
  return useIncidentPeople(id);
}
