'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hazopSessionService } from '../services/hazop-session.service';

export function useHazopAttendance(studyId: string, sessionId?: string) {
  const queryClient = useQueryClient();
  const enabled = Boolean(studyId && sessionId);
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'sessions'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'attendance', sessionId] });
  };
  return {
    attendance: useQuery({ queryKey: ['hazop', studyId, 'attendance', sessionId], queryFn: () => hazopSessionService.attendance(studyId, sessionId!), enabled }),
    mark: useMutation({ mutationFn: (values: Record<string, any>) => hazopSessionService.markAttendance(studyId, sessionId!, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ attendanceId, values }: { attendanceId: string; values: Record<string, any> }) => hazopSessionService.updateAttendance(studyId, sessionId!, attendanceId, values), onSuccess: invalidate }),
    bulk: useMutation({ mutationFn: (records: Record<string, any>[]) => hazopSessionService.bulkAttendance(studyId, sessionId!, records), onSuccess: invalidate })
  };
}
