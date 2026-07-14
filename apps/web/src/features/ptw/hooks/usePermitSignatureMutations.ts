import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RejectSignatureValues, SignatureRequirementValues, SignSignatureValues } from '../schemas/signature.schema';
import { ptwSignatureService } from '../services/ptw-signature.service';

export function usePermitSignatureMutations(permitId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['ptw'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'signatures'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'history'] }),
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  ]);
  return {
    generate: useMutation({ mutationFn: () => ptwSignatureService.generate(permitId), onSuccess: invalidate }),
    sign: useMutation({ mutationFn: ({ signatureId, input }: { signatureId: string; input: SignSignatureValues }) => ptwSignatureService.sign(permitId, signatureId, input), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: ({ signatureId, input }: { signatureId: string; input: RejectSignatureValues }) => ptwSignatureService.reject(permitId, signatureId, input), onSuccess: invalidate }),
    revalidate: useMutation({ mutationFn: (signatureId: string) => ptwSignatureService.revalidate(permitId, signatureId), onSuccess: invalidate }),
    createRequirement: useMutation({ mutationFn: (input: SignatureRequirementValues) => ptwSignatureService.createRequirement(input), onSuccess: invalidate }),
    updateRequirement: useMutation({ mutationFn: ({ requirementId, input }: { requirementId: string; input: SignatureRequirementValues }) => ptwSignatureService.updateRequirement(requirementId, input), onSuccess: invalidate }),
    deleteRequirement: useMutation({ mutationFn: (requirementId: string) => ptwSignatureService.deleteRequirement(requirementId), onSuccess: invalidate })
  };
}
