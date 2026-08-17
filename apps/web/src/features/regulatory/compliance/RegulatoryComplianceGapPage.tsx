'use client';

import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryComplianceGaps } from '../hooks/useRegulatoryComplianceGaps';
import { RegulatoryComplianceGapTable } from './RegulatoryComplianceGapTable';

export function RegulatoryComplianceGapPage({ initialFilters }: { initialFilters?: Record<string, unknown> | undefined }) {
  const query = useRegulatoryComplianceGaps(initialFilters ?? {});
  if (query.isLoading) return <RegulatoryLayout current="Compliance Status"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Compliance Status"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return <RegulatoryLayout current="Compliance Status"><div className="space-y-5"><RegulatoryHeader title="Compliance Gaps" subtitle="Backend-detected and manually recorded compliance gaps with severity, owner, action/CAPA foundation, and readiness impact." onRefresh={() => query.refetch()} /><RegulatoryComplianceGapTable rows={query.data?.rows} /></div></RegulatoryLayout>;
}
