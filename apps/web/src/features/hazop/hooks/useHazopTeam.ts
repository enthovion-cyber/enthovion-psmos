'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopTeamService } from '../services/hazop-team.service';
import type { HazopTeamFilters } from '../types/hazop-team.types';

export function useHazopTeam(studyId: string, filters: HazopTeamFilters) {
  const enabled = Boolean(studyId);
  return {
    context: useQuery({ queryKey: ['hazop', studyId, 'team-context'], queryFn: () => hazopTeamService.context(studyId), enabled }),
    summary: useQuery({ queryKey: ['hazop', studyId, 'team-summary'], queryFn: () => hazopTeamService.summary(studyId), enabled }),
    coverage: useQuery({ queryKey: ['hazop', studyId, 'team-coverage'], queryFn: () => hazopTeamService.coverage(studyId), enabled }),
    readiness: useQuery({ queryKey: ['hazop', studyId, 'team-readiness'], queryFn: () => hazopTeamService.readiness(studyId), enabled }),
    members: useQuery({ queryKey: ['hazop', studyId, 'team-members', filters], queryFn: () => hazopTeamService.list(studyId, filters), enabled })
  };
}
