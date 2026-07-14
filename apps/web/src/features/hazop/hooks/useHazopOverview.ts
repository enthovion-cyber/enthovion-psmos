'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopOverviewService } from '../services/hazop-overview.service';

export function useHazopOverview(id: string) {
  return useQuery({ queryKey: ['hazop', id, 'overview'], queryFn: () => hazopOverviewService.get(id), enabled: Boolean(id) });
}

export function useHazopOverviewKpis(id: string) {
  return useQuery({ queryKey: ['hazop', id, 'overview', 'kpis'], queryFn: () => hazopOverviewService.kpis(id), enabled: Boolean(id) });
}

export function useHazopOverviewRiskSnapshot(id: string) {
  return useQuery({ queryKey: ['hazop', id, 'overview', 'risk-snapshot'], queryFn: () => hazopOverviewService.riskSnapshot(id), enabled: Boolean(id) });
}

export function useHazopOverviewReadiness(id: string) {
  return useQuery({ queryKey: ['hazop', id, 'overview', 'readiness'], queryFn: () => hazopOverviewService.readiness(id), enabled: Boolean(id) });
}
