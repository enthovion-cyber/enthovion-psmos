'use client';

import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryErrorState, RegulatoryField, RegulatoryLoadingState, regulatoryInputClass } from '../shared/RegulatoryUi';
import { useRegulatoryActions } from '../hooks/useRegulatoryActions';
import { ActionSummaryCards, RegulatoryActionTable } from './components/RegulatoryActionUi';

export function RegulatoryActionRegisterPage({ view }: { view?: string }) {
  const [q, setQ] = useState('');
  const filters = { q, view };
  const query = useRegulatoryActions(filters);
  if (query.isLoading) return <RegulatoryLayout current="Action Register"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Action Register"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="Action Register">
      <div className="space-y-5">
        <RegulatoryHeader title="Regulatory Action Register" subtitle="Server-side regulatory action links, CAPA package foundations, sync status, readiness, verification, and effectiveness." action={<><RegulatoryButton href="/regulatory/actions/new">Create Action</RegulatoryButton><RegulatoryButton href="/regulatory/actions/link-existing" variant="secondary">Link Existing</RegulatoryButton></>} />
        <ActionSummaryCards summary={query.data?.summary} />
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <RegulatoryField label="Search">
            <input className={regulatoryInputClass()} value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search action title, code, source, owner, status" />
          </RegulatoryField>
        </div>
        <RegulatoryActionTable rows={query.data?.rows} onRefresh={() => query.refetch()} />
      </div>
    </RegulatoryLayout>
  );
}
