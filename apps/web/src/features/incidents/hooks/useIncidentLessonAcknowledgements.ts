import { useIncidentLessons } from './useIncidentLessons';
export function useIncidentLessonAcknowledgements(id: string) { const query = useIncidentLessons(id); return { ...query, data: query.data?.acknowledgements }; }
