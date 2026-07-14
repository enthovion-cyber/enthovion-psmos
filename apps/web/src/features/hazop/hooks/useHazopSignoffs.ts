'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopSignoffService } from '../services/hazop-signoff.service';

export function useHazopSignoffs(studyId: string) {
  return useQuery({ queryKey: ['hazop', studyId, 'signoffs'], queryFn: () => hazopSignoffService.list(studyId), enabled: Boolean(studyId), refetchOnMount: 'always', refetchOnWindowFocus: false });
}
