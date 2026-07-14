import { useQuery } from '@tanstack/react-query';
import { ptwIsolationService } from '../services/ptw-isolation.service';

export function usePermitIsolation(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'isolation'], queryFn: () => ptwIsolationService.list(permitId), enabled: Boolean(permitId) });
}

export function usePermitIsolationSummary(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'isolation', 'summary'], queryFn: () => ptwIsolationService.summary(permitId), enabled: Boolean(permitId) });
}

export function usePermitIsolationHistory(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'isolation', 'history'], queryFn: () => ptwIsolationService.history(permitId), enabled: Boolean(permitId) });
}

export function usePermitIsolationCertificate(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'isolation', 'certificate'], queryFn: () => ptwIsolationService.certificate(permitId), enabled: Boolean(permitId) });
}
