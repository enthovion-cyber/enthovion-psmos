import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pssrStartupAuthorizationService } from '../services/pssr-startup-authorization.service';

export function usePSSRAuthorizationMutations(pssrId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId] });
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId, 'startup-authorization'] });
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId, 'history'] });
  };
  return {
    readinessCheck: useMutation({ mutationFn: () => pssrStartupAuthorizationService.readinessCheck(pssrId), onSuccess: invalidate }),
    generateSignatures: useMutation({ mutationFn: () => pssrStartupAuthorizationService.generateSignatures(pssrId), onSuccess: invalidate }),
    sign: useMutation({ mutationFn: (signatureId: string) => pssrStartupAuthorizationService.sign(pssrId, signatureId), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: ({ signatureId, reason }: { signatureId: string; reason: string }) => pssrStartupAuthorizationService.reject(pssrId, signatureId, reason), onSuccess: invalidate }),
    markReady: useMutation({ mutationFn: () => pssrStartupAuthorizationService.markReady(pssrId), onSuccess: invalidate }),
    authorize: useMutation({ mutationFn: () => pssrStartupAuthorizationService.authorize(pssrId), onSuccess: invalidate }),
    release: useMutation({ mutationFn: () => pssrStartupAuthorizationService.release(pssrId), onSuccess: invalidate }),
    returnForCorrection: useMutation({ mutationFn: (reason: string) => pssrStartupAuthorizationService.returnForCorrection(pssrId, reason), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (reason: string) => pssrStartupAuthorizationService.cancel(pssrId, reason), onSuccess: invalidate }),
    addCondition: useMutation({ mutationFn: (values: Record<string, any>) => pssrStartupAuthorizationService.addCondition(pssrId, values), onSuccess: invalidate })
  };
}
