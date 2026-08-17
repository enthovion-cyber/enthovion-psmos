'use client';

import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryAuditCoverage } from '../hooks/useRegulatoryAuditCoverage';
import { AuditMappingRecordTable } from './AuditMappingUi';

export function RegulatoryAuditCoveragePage({ filters }: { filters?: Record<string, unknown> }) {
  const query = useRegulatoryAuditCoverage({ limit: 500, ...(filters ?? {}) });
  if (query.isLoading) return <RegulatoryLayout current="Audit Coverage"><RegulatoryLoadingState rows={7} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Audit Coverage"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return <RegulatoryLayout current="Audit Coverage"><div className="space-y-5"><RegulatoryHeader title="Audit Coverage" subtitle="Backend-generated audit coverage records for regulatory requirements and obligations." onRefresh={() => query.refetch()} /><RegulatoryCard title="Coverage Register"><AuditMappingRecordTable rows={query.data?.rows} /></RegulatoryCard></div></RegulatoryLayout>;
}
