import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentLessonsService } from '../services/incident-lessons.service';
import type { IncidentLessonsData } from '../types/incident-lesson.types';

export function useIncidentLessons(id: string) {
  return useQuery<IncidentLessonsData>({ queryKey: ['incidents', 'lessons', id], queryFn: () => incidentLessonsService.tab(id), enabled: !!id, refetchOnWindowFocus: false });
}

export function useIncidentLessonsMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'lessons', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    create: useMutation({ mutationFn: (values: any) => incidentLessonsService.create(id, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ lessonId, values }: any) => incidentLessonsService.update(id, lessonId, values), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: ({ lessonId, values }: any) => incidentLessonsService.remove(id, lessonId, values), onSuccess: invalidate }),
    generate: useMutation({ mutationFn: (values: any) => incidentLessonsService.generate(id, values), onSuccess: invalidate }),
    linkSource: useMutation({ mutationFn: ({ lessonId, values }: any) => incidentLessonsService.linkSource(id, lessonId, values), onSuccess: invalidate }),
    distribute: useMutation({ mutationFn: ({ lessonId, values }: any) => incidentLessonsService.distribute(id, lessonId, values), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: ({ lessonId, values }: any) => incidentLessonsService.verify(id, lessonId, values), onSuccess: invalidate }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentLessonsService.requestReview(id, values), onSuccess: invalidate }),
    approveReview: useMutation({ mutationFn: (values: any) => incidentLessonsService.approveReview(id, values), onSuccess: invalidate }),
    rejectReview: useMutation({ mutationFn: (values: any) => incidentLessonsService.rejectReview(id, values), onSuccess: invalidate })
  };
}
