'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopSessionService } from '../services/hazop-session.service';

export function useHazopSessionMinutes(studyId: string, sessionId?: string) {
  return useQuery({ queryKey: ['hazop', studyId, 'minutes', sessionId], queryFn: () => hazopSessionService.minutes(studyId, sessionId!), enabled: Boolean(studyId && sessionId) });
}
