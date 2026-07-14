'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopRecommendationService } from '../services/hazop-recommendation.service';
import type { HazopRecommendationFilters } from '../types/hazop-recommendation.types';

export function useHazopRecommendations(studyId: string, filters: HazopRecommendationFilters) {
  const enabled = Boolean(studyId);
  return {
    context: useQuery({ queryKey: ['hazop', studyId, 'recommendations-context'], queryFn: () => hazopRecommendationService.context(studyId), enabled }),
    summary: useQuery({ queryKey: ['hazop', studyId, 'recommendations-summary'], queryFn: () => hazopRecommendationService.summary(studyId), enabled }),
    register: useQuery({ queryKey: ['hazop', studyId, 'recommendations-register', filters], queryFn: () => hazopRecommendationService.register(studyId, filters), enabled }),
    overdue: useQuery({ queryKey: ['hazop', studyId, 'recommendations-overdue'], queryFn: () => hazopRecommendationService.overdue(studyId), enabled }),
    blockers: useQuery({ queryKey: ['hazop', studyId, 'recommendations-blockers'], queryFn: () => hazopRecommendationService.closureBlockers(studyId), enabled })
  };
}
