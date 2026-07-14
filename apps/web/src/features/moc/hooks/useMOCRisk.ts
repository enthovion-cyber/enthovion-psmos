'use client';

import { useQuery } from '@tanstack/react-query';
import { mocRiskService } from '../services/moc-risk.service';

export function useMOCRisk(id: string) {
  return useQuery({ queryKey: ['moc', id, 'risk'], queryFn: () => mocRiskService.detail(id), enabled: Boolean(id), refetchOnWindowFocus: false });
}

export function useMOCRiskHistory(id: string) {
  return useQuery({ queryKey: ['moc', id, 'risk-history'], queryFn: () => mocRiskService.history(id), enabled: Boolean(id), refetchOnWindowFocus: false });
}

export function useMOCRiskReviewRequirements(id: string) {
  return useQuery({ queryKey: ['moc', id, 'risk-review-requirements'], queryFn: () => mocRiskService.reviewRequirements(id), enabled: Boolean(id), refetchOnWindowFocus: false });
}
