import { useIncidentLessons } from './useIncidentLessons';
export function useIncidentLessonDistribution(id: string) { const query = useIncidentLessons(id); return { ...query, data: query.data?.communicationDistribution }; }
