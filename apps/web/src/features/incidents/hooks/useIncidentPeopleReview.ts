import { useIncidentPeople } from './useIncidentPeople';

export function useIncidentPeopleReview(id: string) {
  return useIncidentPeople(id);
}
