import { useIncidentLessons } from './useIncidentLessons';
export function useIncidentLessonsSummary(id: string) { const query = useIncidentLessons(id); return { ...query, data: query.data?.summaryCards }; }
