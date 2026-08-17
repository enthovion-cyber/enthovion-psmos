'use client';

import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryActionDashboard } from '../hooks/useRegulatoryActionDashboard';
import { ActionSummaryCards, RegulatoryActionTable, valueText } from './components/RegulatoryActionUi';

export function RegulatoryActionDashboardPage({ view }: { view?: string }) {
  const query = view ? useRegulatoryActionDashboard({ view }) : useRegulatoryActionDashboard();
  if (query.isLoading) return <RegulatoryLayout current="Actions / CAPA"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Actions / CAPA"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const data = query.data;
  return (
    <RegulatoryLayout current="Actions / CAPA">
      <div className="space-y-5">
        <RegulatoryHeader
          title="Regulatory Actions / CAPA Integration"
          subtitle="Universal Action Engine and Audit CAPA links for regulatory gaps, obligations, evidence, audit mapping, and compliance closure readiness."
          action={<><RegulatoryButton href="/regulatory/actions/new">Create Action</RegulatoryButton><RegulatoryButton href="/regulatory/actions/link-existing" variant="secondary">Link Existing</RegulatoryButton><RegulatoryButton href="/regulatory/actions/capa" variant="secondary">CAPA Packages</RegulatoryButton></>}
        />
        <ActionSummaryCards summary={data?.summary} />
        <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
          <RegulatoryActionTable rows={data?.rows} onRefresh={() => query.refetch()} title={view ? `${view} regulatory actions` : 'Recent regulatory action links'} />
          <RegulatoryCard title="Integration Status" subtitle="Backend controlled sync, closure readiness, verification, and effectiveness">
            <div className="space-y-3 text-sm text-[var(--psm-muted)]">
              <p>Total linked sources: <span className="font-semibold text-[var(--psm-fg)]">{valueText(data?.summary?.total, '0')}</span></p>
              <p>Blocking compliance: <span className="font-semibold text-[var(--psm-fg)]">{valueText(data?.summary?.blockingCompliance, '0')}</span></p>
              <p>Stale sync: <span className="font-semibold text-[var(--psm-fg)]">{valueText(data?.summary?.staleSync, '0')}</span></p>
              <p>Ready for gap closure: <span className="font-semibold text-[var(--psm-fg)]">{valueText(data?.summary?.readyForGapClosure, '0')}</span></p>
            </div>
          </RegulatoryCard>
        </div>
      </div>
    </RegulatoryLayout>
  );
}
