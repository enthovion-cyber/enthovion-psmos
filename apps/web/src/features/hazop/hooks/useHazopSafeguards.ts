'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopSafeguardService } from '../services/hazop-safeguard.service';
import type { HazopSafeguardFilters } from '../types/hazop-safeguard.types';

export function useHazopSafeguards(studyId: string, filters: HazopSafeguardFilters) {
  const enabled = Boolean(studyId);
  return {
    context: useQuery({ queryKey: ['hazop', studyId, 'safeguards-context'], queryFn: () => hazopSafeguardService.context(studyId), enabled }),
    summary: useQuery({ queryKey: ['hazop', studyId, 'safeguards-summary'], queryFn: () => hazopSafeguardService.summary(studyId), enabled }),
    register: useQuery({ queryKey: ['hazop', studyId, 'safeguards-register', filters], queryFn: () => hazopSafeguardService.register(studyId, filters), enabled }),
    iplCandidates: useQuery({ queryKey: ['hazop', studyId, 'safeguards-ipl-candidates'], queryFn: () => hazopSafeguardService.iplCandidates(studyId), enabled }),
    proofTests: useQuery({ queryKey: ['hazop', studyId, 'safeguards-proof-tests'], queryFn: () => hazopSafeguardService.proofTests(studyId), enabled })
  };
}
