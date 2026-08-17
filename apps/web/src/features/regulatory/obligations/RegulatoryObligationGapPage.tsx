'use client';

import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryField, RegulatoryLoadingState, regulatoryInputClass } from '../shared/RegulatoryUi';
import { useRegulatoryObligationGaps, useRegulatoryObligationLookups, useRegulatoryObligationMutations } from '../hooks/useRegulatoryObligations';
import { RegulatoryObligationGapTable } from './RegulatoryObligationGapTable';
import type { RegulatoryObligationGap } from '../types/regulatory-obligation.types';

export function RegulatoryObligationGapPage() {
  const [filters, setFilters] = useState<Record<string, unknown>>({ limit: 100 });
  const query = useRegulatoryObligationGaps(filters);
  const lookups = useRegulatoryObligationLookups();
  const mutations = useRegulatoryObligationMutations();
  const resolve = (gap: RegulatoryObligationGap) => {
    const reason = window.prompt('Resolution note or waiver foundation reason');
    if (reason) mutations.resolveGap.mutate({ gapId: gap.id, reason });
  };
  if (query.isLoading) return <RegulatoryLayout current="Obligation Gaps"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Obligation Gaps"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="Obligation Gaps">
      <div className="space-y-5">
        <RegulatoryHeader title="Obligation Gaps" subtitle="Backend-detected and manually created obligation gaps for owners, scope, evidence, due dates, module mapping, stale status, and actions." action={<RegulatoryButton disabled={mutations.detectGaps.isPending} title={mutations.detectGaps.isPending ? 'Gap detection is running' : 'Run backend gap detection'} onClick={() => mutations.detectGaps.mutate({})}>Detect Gaps</RegulatoryButton>} onRefresh={() => query.refetch()} />
        <RegulatoryCard title="Gap Filters">
          <div className="grid gap-3 md:grid-cols-3">
            <RegulatoryField label="Gap Type"><select className={regulatoryInputClass()} value={String(filters.gapType ?? '')} onChange={(event) => setFilters({ ...filters, gapType: event.target.value || undefined })}><option value="">All</option>{lookups.data?.obligationGapTypes?.map((type) => <option key={type}>{type}</option>)}</select></RegulatoryField>
            <RegulatoryField label="Gap Status"><select className={regulatoryInputClass()} value={String(filters.gapStatus ?? '')} onChange={(event) => setFilters({ ...filters, gapStatus: event.target.value || undefined })}><option value="">All</option><option>Open</option><option>Resolved</option><option>Waived Foundation</option></select></RegulatoryField>
          </div>
        </RegulatoryCard>
        <RegulatoryCard title="Gap Register" subtitle="Gap closure requires a fix note or waiver foundation reason and creates audit/history."><RegulatoryObligationGapTable rows={query.data?.rows} onResolve={resolve} /></RegulatoryCard>
      </div>
    </RegulatoryLayout>
  );
}
