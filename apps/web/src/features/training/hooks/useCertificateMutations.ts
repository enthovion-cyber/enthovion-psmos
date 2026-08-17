import { useMutation, useQueryClient } from '@tanstack/react-query';
import { certificationService } from '../services/certification.service';

export function useCertificateMutations(certificateId?: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['training', 'certifications'] });
  return {
    create: useMutation({ mutationFn: certificationService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (payload: Record<string, unknown>) => certificationService.update(String(certificateId), payload), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: (payload?: Record<string, unknown>) => certificationService.verify(String(certificateId), payload), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (payload: Record<string, unknown>) => certificationService.reject(String(certificateId), payload), onSuccess: invalidate }),
    renew: useMutation({ mutationFn: (payload: Record<string, unknown>) => certificationService.renew(String(certificateId), payload), onSuccess: invalidate }),
    revoke: useMutation({ mutationFn: (payload: Record<string, unknown>) => certificationService.revoke(String(certificateId), payload), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (payload?: Record<string, unknown>) => certificationService.archive(String(certificateId), payload), onSuccess: invalidate })
  };
}
