import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pssrFieldVerificationService } from '../services/pssr-field-verification.service';

export function usePSSRFieldMutations(pssrId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['pssr', pssrId] });
  return {
    generate: useMutation({ mutationFn: () => pssrFieldVerificationService.generate(pssrId), onSuccess: invalidate }),
    verifyEquipment: useMutation({ mutationFn: (verificationId: string) => pssrFieldVerificationService.verifyEquipment(pssrId, verificationId), onSuccess: invalidate }),
    failEquipment: useMutation({ mutationFn: ({ verificationId, reason }: { verificationId: string; reason: string }) => pssrFieldVerificationService.failEquipment(pssrId, verificationId, reason), onSuccess: invalidate }),
    updateChecklistItem: useMutation({ mutationFn: ({ itemId, values }: { itemId: string; values: Record<string, any> }) => pssrFieldVerificationService.updateChecklistItem(pssrId, itemId, values), onSuccess: invalidate }),
    evidence: useMutation({ mutationFn: (values: Record<string, any>) => pssrFieldVerificationService.evidence(pssrId, values), onSuccess: invalidate }),
    signoff: useMutation({ mutationFn: (values: Record<string, any>) => pssrFieldVerificationService.signoff(pssrId, values), onSuccess: invalidate }),
    scanEquipment: useMutation({ mutationFn: (values: Record<string, any>) => pssrFieldVerificationService.scanEquipment(pssrId, values), onSuccess: invalidate })
  };
}
