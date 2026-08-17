'use client';

import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryAuditMappingMatrix } from '../hooks/useRegulatoryAuditMappingMatrix';
import { RegulatoryAuditMappingSummaryCards } from './RegulatoryAuditMappingSummaryCards';
import { RegulatoryAuditMappingMatrixTable } from './RegulatoryAuditMappingMatrixTable';

export function RegulatoryAuditMappingMatrixPage() {
  const query = useRegulatoryAuditMappingMatrix({ limit: 5000 });
  if (query.isLoading) return <RegulatoryLayout current="Audit Mapping Matrix"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Audit Mapping Matrix"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return <RegulatoryLayout current="Audit Mapping Matrix"><div className="space-y-5"><RegulatoryHeader title="Audit Mapping Matrix" subtitle="Obligation-by-obligation backend coverage matrix." onRefresh={() => query.refetch()} /><RegulatoryAuditMappingSummaryCards summary={query.data?.summary} /><RegulatoryAuditMappingMatrixTable rows={query.data?.rows} /></div></RegulatoryLayout>;
}
