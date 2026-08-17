'use client';

import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryAuditMappingGaps } from '../hooks/useRegulatoryAuditMappingGaps';
import { useRegulatoryAuditMappingMutations } from '../hooks/useRegulatoryAuditMappingMutations';
import { RegulatoryAuditMappingGapTable } from './RegulatoryAuditMappingGapTable';

export function RegulatoryAuditMappingGapPage({ filters }: { filters?: Record<string, unknown> }) {
  const query = useRegulatoryAuditMappingGaps({ limit: 500, ...(filters ?? {}) });
  const mutations = useRegulatoryAuditMappingMutations();
  if (query.isLoading) return <RegulatoryLayout current="Audit Mapping Gaps"><RegulatoryLoadingState rows={7} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Audit Mapping Gaps"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return <RegulatoryLayout current="Audit Mapping Gaps"><div className="space-y-5"><RegulatoryHeader title="Audit Mapping Gaps" subtitle="Backend-detected missing checklist, evidence, finding, CAPA, score, stale, and unmapped obligation gaps." onRefresh={() => query.refetch()} action={<RegulatoryButton variant="secondary" disabled={mutations.detectGaps.isPending} title={mutations.detectGaps.isPending ? 'Detecting gaps...' : 'Run backend gap detection'} onClick={() => mutations.detectGaps.mutate(filters ?? {})}>Detect Gaps</RegulatoryButton>} /><RegulatoryAuditMappingGapTable rows={query.data?.rows} /></div></RegulatoryLayout>;
}
