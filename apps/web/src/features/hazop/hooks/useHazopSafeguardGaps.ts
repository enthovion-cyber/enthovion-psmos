'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopSafeguardService } from '../services/hazop-safeguard.service';

export function useHazopSafeguardGaps(studyId: string) {
  return useQuery({ queryKey: ['hazop', studyId, 'safeguard-gaps'], queryFn: () => hazopSafeguardService.gaps(studyId), enabled: Boolean(studyId) });
}
