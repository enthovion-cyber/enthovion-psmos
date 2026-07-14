import { useIncidentPeople } from './useIncidentPeople';

export function useIncidentMedicalOutcome(id: string) {
  return useIncidentPeople(id);
}
