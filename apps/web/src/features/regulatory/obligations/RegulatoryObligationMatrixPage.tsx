'use client';

import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState, RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';
import { useRegulatoryObligationMatrix } from '../hooks/useRegulatoryObligations';
import { RegulatoryObligationMatrixTable } from './RegulatoryObligationMatrixTable';

const matrixViews = ['Regulation -> Obligation -> Site', 'Regulation -> Obligation -> Unit', 'Obligation -> Evidence Expectation', 'Obligation -> PSM Module', 'Obligation -> Owner', 'Obligation -> Due Date', 'Obligation -> Audit Mapping', 'Obligation -> Action / CAPA', 'Jurisdiction -> Obligation -> Applicability', 'PSM Element -> Obligation -> Status'];

export function RegulatoryObligationMatrixPage() {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 50, matrixView: matrixViews[0] });
  const query = useRegulatoryObligationMatrix(filters);
  if (query.isLoading) return <RegulatoryLayout current="Obligation Matrix"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Obligation Matrix"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="Obligation Matrix">
      <div className="space-y-5">
        <RegulatoryHeader title="Obligation Matrix" subtitle="Backend-driven obligation responsibility matrix by requirement, scope, owner, evidence, module, audit/action links, gaps, and stale status." onRefresh={() => query.refetch()} />
        <RegulatoryCard title="Matrix View"><RegulatoryField label="View"><select className={regulatoryInputClass()} value={String(filters.matrixView ?? '')} onChange={(event) => setFilters({ ...filters, matrixView: event.target.value, page: 1 })}>{matrixViews.map((view) => <option key={view}>{view}</option>)}</select></RegulatoryField></RegulatoryCard>
        <RegulatoryObligationMatrixTable data={query.data} />
      </div>
    </RegulatoryLayout>
  );
}
