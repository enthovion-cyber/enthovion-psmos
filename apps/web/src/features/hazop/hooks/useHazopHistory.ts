'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopHistoryService } from '../services/hazop-history.service';
import type { HazopHistoryFilters } from '../types/hazop-history.types';

export function useHazopHistory(studyId: string, filters: HazopHistoryFilters) {
  const enabled = Boolean(studyId);
  return {
    summary: useQuery({ queryKey: ['hazop', studyId, 'history-summary'], queryFn: () => hazopHistoryService.summary(studyId), enabled }),
    events: useQuery({ queryKey: ['hazop', studyId, 'history', filters], queryFn: () => hazopHistoryService.list(studyId, filters), enabled }),
    safetyCritical: useQuery({ queryKey: ['hazop', studyId, 'history-safety-critical'], queryFn: () => hazopHistoryService.safetyCritical(studyId), enabled })
  };
}
