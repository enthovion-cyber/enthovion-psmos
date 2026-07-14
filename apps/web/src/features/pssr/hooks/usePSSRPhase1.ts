'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pssrPhase1Service } from '../services/pssr-phase1.service';

export function usePSSRAutoVerification(id: string) {
  return useQuery({ queryKey: ['pssr', id, 'auto-verifications'], queryFn: () => pssrPhase1Service.autoVerifications(id), refetchOnWindowFocus: false });
}

export function usePSSRDisciplineSignoffs(id: string) {
  return useQuery({ queryKey: ['pssr', id, 'discipline-signoffs'], queryFn: () => pssrPhase1Service.disciplineSignoffs(id), refetchOnWindowFocus: false });
}

export function usePSSRCertificate(id: string) {
  return useQuery({ queryKey: ['pssr', id, 'certificate'], queryFn: () => pssrPhase1Service.certificate(id), refetchOnWindowFocus: false, retry: false });
}

export function usePSSRSecureShares(id: string) {
  return useQuery({ queryKey: ['pssr', id, 'secure-shares'], queryFn: () => pssrPhase1Service.secureShares(id), refetchOnWindowFocus: false });
}

export function usePSSRPhase1Mutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pssr', id] });
    queryClient.invalidateQueries({ queryKey: ['pssr', id, 'auto-verifications'] });
    queryClient.invalidateQueries({ queryKey: ['pssr', id, 'discipline-signoffs'] });
    queryClient.invalidateQueries({ queryKey: ['pssr', id, 'certificate'] });
    queryClient.invalidateQueries({ queryKey: ['pssr', id, 'secure-shares'] });
    queryClient.invalidateQueries({ queryKey: ['pssr', 'dashboard'] });
  };
  return {
    syncAutoVerifications: useMutation({ mutationFn: () => pssrPhase1Service.syncAutoVerifications(id), onSuccess: invalidate }),
    generateHazardItems: useMutation({ mutationFn: () => pssrPhase1Service.generateHazardItems(id), onSuccess: invalidate }),
    generateDisciplineSignoffs: useMutation({ mutationFn: () => pssrPhase1Service.generateDisciplineSignoffs(id), onSuccess: invalidate }),
    signDiscipline: useMutation({ mutationFn: ({ signoffId, values }: { signoffId: string; values: Record<string, any> }) => pssrPhase1Service.signDiscipline(id, signoffId, values), onSuccess: invalidate }),
    rejectDiscipline: useMutation({ mutationFn: ({ signoffId, values }: { signoffId: string; values: Record<string, any> }) => pssrPhase1Service.rejectDiscipline(id, signoffId, values), onSuccess: invalidate }),
    generateCertificate: useMutation({ mutationFn: () => pssrPhase1Service.generateCertificate(id), onSuccess: invalidate }),
    validateCertificate: useMutation({ mutationFn: () => pssrPhase1Service.validateCertificate(id), onSuccess: invalidate }),
    createSecureShare: useMutation({ mutationFn: (values: Record<string, any>) => pssrPhase1Service.createSecureShare(id, values), onSuccess: invalidate }),
    revokeSecureShare: useMutation({ mutationFn: (shareId: string) => pssrPhase1Service.revokeSecureShare(id, shareId), onSuccess: invalidate })
  };
}
