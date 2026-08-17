'use client';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryApplicabilityMatrix } from '../hooks/useRegulatoryApplicabilityMatrix';
import { RegulatoryApplicabilityMatrixTable } from './RegulatoryApplicabilityMatrixTable';

export function RegulatoryApplicabilityMatrixPage() {
  const query = useRegulatoryApplicabilityMatrix();
  return <RegulatoryLayout current="Applicability Matrix"><div className="space-y-5"><RegulatoryHeader title="Applicability Matrix" subtitle="Requirement vs site/unit/equipment, jurisdiction vs site, category, criticality and PSM element views." />{query.isLoading ? <RegulatoryLoadingState /> : query.isError ? <RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /> : <RegulatoryCard title="Matrix" subtitle={(query.data?.views ?? []).join(' | ')}><RegulatoryApplicabilityMatrixTable rows={query.data?.rows} /></RegulatoryCard>}</div></RegulatoryLayout>;
}
