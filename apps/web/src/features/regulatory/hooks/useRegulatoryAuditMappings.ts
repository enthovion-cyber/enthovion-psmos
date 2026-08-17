import { useQuery } from '@tanstack/react-query';
import { regulatoryAuditMappingService } from '../services/regulatory-audit-mapping.service';

export function useRegulatoryAuditMappings(params?: Record<string, unknown>, view?: string) {
  return useQuery({ queryKey: ['regulatory', 'audit-mapping', 'register', view, params], queryFn: () => view ? regulatoryAuditMappingService.filtered(view, params) : regulatoryAuditMappingService.register(params), refetchOnWindowFocus: false });
}

export function useRegulatoryAuditMappingsFromSource(source: { kind: string; id: string } | undefined, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['regulatory', 'audit-mapping', 'source', source, params],
    enabled: Boolean(source?.kind && source?.id),
    queryFn: () => {
      if (!source) throw new Error('Source is required.');
      if (source.kind === 'item') return regulatoryAuditMappingService.sourceItem(source.id, params);
      if (source.kind === 'obligation') return regulatoryAuditMappingService.sourceObligation(source.id, params);
      if (source.kind === 'assessment') return regulatoryAuditMappingService.rowsFromSource('compliance-status/assessments', source.id, params);
      if (source.kind === 'gap') return regulatoryAuditMappingService.rowsFromSource('compliance-status/gaps', source.id, params);
      if (source.kind === 'evidenceLink') return regulatoryAuditMappingService.rowsFromSource('evidence/links', source.id, params);
      if (source.kind === 'evidencePackage') return regulatoryAuditMappingService.rowsFromSource('evidence/packages', source.id, params);
      if (['sites', 'units', 'areas', 'equipment'].includes(source.kind)) return regulatoryAuditMappingService.scoped(source.kind as 'sites' | 'units' | 'areas' | 'equipment', source.id, params);
      return regulatoryAuditMappingService.auditScoped(source.kind, source.id, params);
    },
    refetchOnWindowFocus: false
  });
}
