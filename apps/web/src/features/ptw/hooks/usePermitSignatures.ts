import { useQuery } from '@tanstack/react-query';
import { ptwSignatureService } from '../services/ptw-signature.service';

export function usePermitSignatures(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'signatures'], queryFn: () => ptwSignatureService.list(permitId) });
}

export function usePermitSignatureSummary(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'signatures', 'summary'], queryFn: () => ptwSignatureService.summary(permitId) });
}

export function usePermitSignatureHistory(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'signatures', 'history'], queryFn: () => ptwSignatureService.history(permitId) });
}

export function usePermitSignatureRequirements() {
  return useQuery({ queryKey: ['ptw', 'signature-requirements'], queryFn: () => ptwSignatureService.requirements() });
}
