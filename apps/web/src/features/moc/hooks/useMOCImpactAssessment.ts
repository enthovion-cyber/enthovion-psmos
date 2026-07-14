'use client';

import { useQuery } from '@tanstack/react-query';
import { mocImpactService } from '../services/moc-impact.service';

export function useMOCImpactAssessment(id: string) {
  return useQuery({ queryKey: ['moc', id, 'impact-assessment'], queryFn: () => mocImpactService.assessment(id), enabled: Boolean(id), refetchOnWindowFocus: false });
}

export function useMOCImpactGeneratedActions(id: string) {
  return useQuery({ queryKey: ['moc', id, 'impact-generated-actions'], queryFn: () => mocImpactService.generatedActions(id), enabled: Boolean(id), refetchOnWindowFocus: false });
}

export function useMOCImpactBlockers(id: string) {
  const startup = useQuery({ queryKey: ['moc', id, 'startup-blockers'], queryFn: () => mocImpactService.startupBlockers(id), enabled: Boolean(id), refetchOnWindowFocus: false });
  const closure = useQuery({ queryKey: ['moc', id, 'closure-blockers'], queryFn: () => mocImpactService.closureBlockers(id), enabled: Boolean(id), refetchOnWindowFocus: false });
  return { startup, closure };
}
