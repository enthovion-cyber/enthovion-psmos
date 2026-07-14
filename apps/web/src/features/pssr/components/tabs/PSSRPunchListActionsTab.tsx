'use client';

import { useMemo, useState } from 'react';
import { usePSSRPunchList } from '../../hooks/usePSSRPunchList';
import { usePSSRPunchMutations } from '../../hooks/usePSSRPunchMutations';
import { CategoryAStartupBlockersPanel } from '../punch/CategoryAStartupBlockersPanel';
import { CategoryBPostStartupActionsPanel } from '../punch/CategoryBPostStartupActionsPanel';
import { CategoryCMinorItemsPanel } from '../punch/CategoryCMinorItemsPanel';
import { GenerateSyncPunchControls } from '../punch/GenerateSyncPunchControls';
import { PunchActionDetailDrawer } from '../punch/PunchActionDetailDrawer';
import { PunchEvidenceVerificationPanel } from '../punch/PunchEvidenceVerificationPanel';
import { PunchItemsTable } from '../punch/PunchItemsTable';
import { PunchListSummaryCard } from '../punch/PunchListSummaryCard';
import { RiskAcceptanceDefermentPanel } from '../punch/RiskAcceptanceDefermentPanel';
import { TrafficLightStartupPunchChecklist } from '../punch/TrafficLightStartupPunchChecklist';
import { ErrorState, LoadingState } from '../pssr-ui';

export function PSSRPunchListActionsTab({ pssr }: { pssr: any }) {
  const query = usePSSRPunchList(pssr.id);
  const mutations = usePSSRPunchMutations(pssr.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => (query.data?.items ?? []).find((item: any) => item.id === selectedId) ?? query.data?.items?.[0], [query.data, selectedId]);
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Unable to load punch list from API." />;
  const data = query.data ?? {};
  const busy = mutations.sync.isPending || mutations.refreshActionStatuses.isPending;
  return (
    <div className="space-y-4" onClick={(event) => {
      const target = event.target as HTMLElement;
      const row = target.closest('[data-punch-id]') as HTMLElement | null;
      if (row?.dataset.punchId) setSelectedId(row.dataset.punchId);
    }}>
      <GenerateSyncPunchControls busy={busy} onSync={() => mutations.sync.mutate()} onRefresh={() => mutations.refreshActionStatuses.mutate()} />
      <PunchListSummaryCard summary={data.summary} />
      <TrafficLightStartupPunchChecklist lights={data.trafficLights ?? []} />
      <div className="grid gap-4 xl:grid-cols-3">
        <CategoryAStartupBlockersPanel items={data.items ?? []} />
        <CategoryBPostStartupActionsPanel items={data.items ?? []} />
        <CategoryCMinorItemsPanel items={data.items ?? []} />
      </div>
      <PunchItemsTable items={data.items ?? []} onRequestVerification={(id) => mutations.requestVerification.mutate(id)} onClose={(id) => mutations.close.mutate(id)} onReopen={(id) => mutations.reopen.mutate(id)} />
      <div className="grid gap-4 xl:grid-cols-3">
        <PunchActionDetailDrawer item={selected} />
        <PunchEvidenceVerificationPanel evidence={data.evidence ?? []} verifications={data.verifications ?? []} />
        <RiskAcceptanceDefermentPanel deferrals={data.deferrals ?? []} />
      </div>
    </div>
  );
}
