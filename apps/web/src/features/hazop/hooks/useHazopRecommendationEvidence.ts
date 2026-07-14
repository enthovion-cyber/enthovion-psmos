'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopRecommendationService } from '../services/hazop-recommendation.service';

export function useHazopRecommendationEvidence(studyId: string, recommendationId?: string) {
  return useQuery({ queryKey: ['hazop', studyId, 'recommendation-evidence', recommendationId], queryFn: () => hazopRecommendationService.evidence(studyId, recommendationId ?? ''), enabled: Boolean(studyId && recommendationId) });
}
