'use client';

import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryComplianceMatrix } from '../hooks/useRegulatoryComplianceMatrix';
import { RegulatoryComplianceMatrixTable } from './RegulatoryComplianceMatrixTable';

export function RegulatoryComplianceMatrixPage() {
  const query = useRegulatoryComplianceMatrix({});
  if (query.isLoading) return <RegulatoryLayout current="Compliance Status"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Compliance Status"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return <RegulatoryLayout current="Compliance Status"><div className="space-y-5"><RegulatoryHeader title="Compliance Status Matrix" subtitle={`View: ${query.data?.view ?? 'Regulatory Item -> Obligation -> Compliance Status'}`} onRefresh={() => query.refetch()} /><RegulatoryCard title="Matrix"><RegulatoryComplianceMatrixTable rows={query.data?.rows as Array<Record<string, unknown>> | undefined} columns={query.data?.columns} /></RegulatoryCard></div></RegulatoryLayout>;
}
