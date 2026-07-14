import { useIncidentLessons } from './useIncidentLessons';
export function useIncidentLessonsReadiness(id: string) { const query = useIncidentLessons(id); return { ...query, data: query.data?.readiness }; }
