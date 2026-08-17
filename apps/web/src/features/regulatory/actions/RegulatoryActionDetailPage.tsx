'use client';

import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryActionPriorityBadge } from '../shared/RegulatoryActionPriorityBadge';
import { RegulatoryActionStatusBadge } from '../shared/RegulatoryActionStatusBadge';
import { RegulatoryActionSyncStatusBadge } from '../shared/RegulatoryActionSyncStatusBadge';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryActionDetail } from '../hooks/useRegulatoryActionDetail';
import { useRegulatoryActionMutations } from '../hooks/useRegulatoryActionMutations';
import { ReadinessPanel, formatDate, valueText } from './components/RegulatoryActionUi';

const tabs = ['overview', 'source', 'action-status', 'evidence', 'verification', 'closure-readiness', 'sync-log', 'history'];

export function RegulatoryActionDetailPage({ actionLinkId, tab = 'overview' }: { actionLinkId: string; tab?: string }) {
  const [active, setActive] = useState(tab);
  const query = useRegulatoryActionDetail(actionLinkId);
  const mutations = useRegulatoryActionMutations();
  if (query.isLoading) return <RegulatoryLayout current="Action Detail"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Action Detail"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const row = query.data?.actionLink ?? query.data?.row;
  if (!row) return <RegulatoryLayout current="Action Detail"><RegulatoryErrorState message="Regulatory action link was not found or is outside your scope." /></RegulatoryLayout>;
  const refresh = () => query.refetch();
  return (
    <RegulatoryLayout current="Action Detail">
      <div className="space-y-5">
        <RegulatoryHeader title={row.action_link_title ?? 'Regulatory action'} subtitle={`${row.action_link_code ?? row.id} · ${row.source_type ?? 'Manual source'}`} action={<><RegulatoryButton variant="secondary" onClick={() => mutations.sync.mutate({ actionLinkId })} disabled={mutations.sync.isPending} title={mutations.sync.isPending ? 'Sync already running' : undefined}>Sync</RegulatoryButton><RegulatoryButton variant="secondary" onClick={() => mutations.refreshSnapshot.mutate(actionLinkId)} disabled={mutations.refreshSnapshot.isPending}>Refresh Snapshot</RegulatoryButton><RegulatoryButton onClick={() => mutations.checkReadiness.mutate(actionLinkId)} disabled={mutations.checkReadiness.isPending}>Check Readiness</RegulatoryButton></>} />
        <div className="flex flex-wrap gap-2">
          <RegulatoryActionStatusBadge value={row.action_status} />
          <RegulatoryActionPriorityBadge value={row.action_priority} />
          <RegulatoryActionSyncStatusBadge value={row.sync_status} />
        </div>
        <nav className="flex gap-2 overflow-x-auto">
          {tabs.map((item) => <button key={item} type="button" onClick={() => setActive(item)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${active === item ? 'bg-primary text-white' : 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'}`}>{item.replace(/-/g, ' ')}</button>)}
        </nav>
        {active === 'closure-readiness' ? <ReadinessPanel readiness={query.data?.readiness as Record<string, unknown> | undefined} row={row} /> : null}
        {active !== 'closure-readiness' ? <RegulatoryActionSection tab={active} data={query.data} row={row} onRefresh={refresh} /> : null}
      </div>
    </RegulatoryLayout>
  );
}

function RegulatoryActionSection({ tab, data, row, onRefresh }: { tab: string; data?: Record<string, unknown> | undefined; row: NonNullable<ReturnType<typeof useRegulatoryActionDetail>['data']>['actionLink']; onRefresh: () => void }) {
  if (tab === 'overview') {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <RegulatoryCard title="Action Link Overview" action={<RegulatoryButton variant="secondary" onClick={onRefresh}>Refresh</RegulatoryButton>}>
          <dl className="grid gap-3 text-sm">
            <div><dt className="text-[var(--psm-muted)]">Mode</dt><dd className="font-semibold text-[var(--psm-fg)]">{valueText(row?.action_mode)}</dd></div>
            <div><dt className="text-[var(--psm-muted)]">Type</dt><dd className="font-semibold text-[var(--psm-fg)]">{valueText(row?.regulatory_action_type)}</dd></div>
            <div><dt className="text-[var(--psm-muted)]">Owner</dt><dd className="font-semibold text-[var(--psm-fg)]">{valueText(row?.owner_user_id)}</dd></div>
            <div><dt className="text-[var(--psm-muted)]">Due date</dt><dd className="font-semibold text-[var(--psm-fg)]">{formatDate(row?.due_date)}</dd></div>
          </dl>
        </RegulatoryCard>
        <ReadinessPanel readiness={data?.readiness as Record<string, unknown> | undefined} row={row ?? undefined} />
      </div>
    );
  }
  const sectionData = tab === 'source' ? row?.source_snapshot_json : tab === 'action-status' ? row?.action_snapshot_json : data?.[tab];
  return (
    <RegulatoryCard title={tab.replace(/-/g, ' ')} subtitle="Backend data for this action-link section">
      <pre className="max-h-[520px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(sectionData ?? data ?? row, null, 2)}</pre>
    </RegulatoryCard>
  );
}
