'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopSessionService } from '../services/hazop-session.service';
import type { HazopSessionFilters } from '../types/hazop-session.types';

export function useHazopSessions(studyId: string, filters: HazopSessionFilters) {
  const enabled = Boolean(studyId);
  return {
    sessions: useQuery({ queryKey: ['hazop', studyId, 'sessions', filters], queryFn: () => hazopSessionService.list(studyId, filters), enabled })
  };
}
