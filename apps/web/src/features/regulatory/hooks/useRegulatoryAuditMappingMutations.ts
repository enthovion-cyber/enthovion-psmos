import { useMutation, useQueryClient } from '@tanstack/react-query';
import { regulatoryAuditMappingService } from '../services/regulatory-audit-mapping.service';

export function useRegulatoryAuditMappingMutations(mappingId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['regulatory', 'audit-mapping'] });
  return {
    create: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryAuditMappingService.create(data), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryAuditMappingService.update(String(mappingId), data), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryAuditMappingService.verify(String(mappingId), data), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryAuditMappingService.reject(String(mappingId), data), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryAuditMappingService.submitReview(String(mappingId), data), onSuccess: invalidate }),
    recalculateCoverage: useMutation({ mutationFn: (data?: Record<string, unknown>) => regulatoryAuditMappingService.recalculateCoverage(String(mappingId), data), onSuccess: invalidate }),
    refreshSnapshot: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryAuditMappingService.refreshSnapshot(String(mappingId), data), onSuccess: invalidate }),
    markStale: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryAuditMappingService.markStale(String(mappingId), data), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryAuditMappingService.archive(String(mappingId), data), onSuccess: invalidate }),
    detectGaps: useMutation({ mutationFn: (data?: Record<string, unknown>) => regulatoryAuditMappingService.detectGaps(data), onSuccess: invalidate }),
    createGap: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryAuditMappingService.createGap(data), onSuccess: invalidate })
  };
}
