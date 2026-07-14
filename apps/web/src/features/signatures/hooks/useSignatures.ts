'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signatureService, type ElectronicSignature, type SaveSignatureProfileInput, type SignSignatureInput, type SignatureContext, type SignatureProfile } from '../services/signature.service';

export function useMySignatureProfile() {
  return useQuery({ queryKey: ['signatures', 'my-profile'], queryFn: () => signatureService.myProfile() });
}

export function useSignatureProfileVersions() {
  return useQuery({ queryKey: ['signatures', 'my-profile', 'versions'], queryFn: () => signatureService.versions() });
}

export function useSignatureRequirements(params?: { moduleName?: string; recordType?: string; actionType?: string; siteId?: string }) {
  return useQuery({ queryKey: ['signatures', 'requirements', params], queryFn: () => signatureService.requirements(params) });
}

export function useRecordSignatures(context: Pick<SignatureContext, 'moduleName' | 'recordType' | 'recordId'>) {
  return useQuery({ queryKey: ['signatures', 'record', context], queryFn: () => signatureService.forRecord(context), enabled: Boolean(context.recordId) });
}

export function useSignatureMutations(context?: Pick<SignatureContext, 'moduleName' | 'recordType' | 'recordId'>) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['signatures'] }),
      context ? queryClient.invalidateQueries({ queryKey: ['signatures', 'record', context] }) : Promise.resolve()
    ]);
  };
  return {
    saveProfile: useMutation<SignatureProfile, Error, SaveSignatureProfileInput>({ mutationFn: signatureService.saveProfile, onSuccess: invalidate }),
    updateProfile: useMutation<SignatureProfile, Error, SaveSignatureProfileInput>({ mutationFn: signatureService.updateProfile, onSuccess: invalidate }),
    verifyProfile: useMutation({ mutationFn: signatureService.verifyProfile, onSuccess: invalidate }),
    disableProfile: useMutation({ mutationFn: signatureService.disableProfile, onSuccess: invalidate }),
    setPin: useMutation({ mutationFn: ({ pin, password }: { pin: string; password?: string }) => signatureService.setPin(pin, password), onSuccess: invalidate }),
    changePin: useMutation({ mutationFn: ({ currentPin, newPin }: { currentPin: string; newPin: string }) => signatureService.changePin(currentPin, newPin), onSuccess: invalidate }),
    sign: useMutation<ElectronicSignature, Error, SignSignatureInput>({ mutationFn: signatureService.sign, onSuccess: invalidate }),
    reject: useMutation({ mutationFn: signatureService.reject, onSuccess: invalidate })
  };
}
