import { useQuery } from '@tanstack/react-query';
import { ptwWorkforceService } from '../services/ptw-workforce.service';

export function usePermitWorkforce(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'workforce'], queryFn: () => ptwWorkforceService.list(permitId) });
}

export function usePermitWorkforceSummary(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'workforce', 'summary'], queryFn: () => ptwWorkforceService.summary(permitId) });
}

export function usePermitWorkforceRequiredRoles(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'workforce', 'required-roles'], queryFn: () => ptwWorkforceService.requiredRoles(permitId) });
}

export function usePermitBriefings(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'briefings'], queryFn: () => ptwWorkforceService.briefings(permitId) });
}

export function usePermitWorkforceHistory(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'workforce', 'history'], queryFn: () => ptwWorkforceService.history(permitId) });
}
