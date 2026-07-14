import { useIncidentPeople } from './useIncidentPeople';

export function useIncidentExposureDetails(id: string) {
  return useIncidentPeople(id);
}
