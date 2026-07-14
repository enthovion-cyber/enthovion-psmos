import { useIncidentPeople } from './useIncidentPeople';

export function useIncidentPeopleReadiness(id: string) {
  return useIncidentPeople(id);
}
