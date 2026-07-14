'use client';

import { useState } from 'react';
import { ActionGroupPanels } from '../actions/ActionGroupPanels';
import { ClosedLoopSummaryCard } from '../actions/ClosedLoopSummaryCard';
import { ClosureBlockersPanel } from '../actions/ClosureBlockersPanel';
import { EvidenceVerificationStatus } from '../actions/EvidenceVerificationStatus';
import { GenerateSyncActionsControls } from '../actions/GenerateSyncActionsControls';
import { MOCActionDetailDrawer } from '../actions/MOCActionDetailDrawer';
import { RequiredActionsTable } from '../actions/RequiredActionsTable';
import { StartupBlockersPanel } from '../actions/StartupBlockersPanel';
import { TrafficLightClosureChecklist } from '../actions/TrafficLightClosureChecklist';
import { ErrorState, LoadingState } from '../moc-detail-ui';
import { useMOCActionMutations } from '../../hooks/useMOCActionMutations';
import { useMOCClosedLoopActions } from '../../hooks/useMOCClosedLoopActions';

export function MOCClosedLoopActionsTab({ moc }: { moc: any }) {
  const query = useMOCClosedLoopActions(moc.id);
  const mutations = useMOCActionMutations(moc.id);
  const [selected, setSelected] = useState<any>(null);
  const data = query.data;
  const actions = data?.actions ?? [];

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Unable to load closed-loop actions from API." />;

  return (
    <div className="space-y-4">
      <ClosedLoopSummaryCard summary={data?.summary} />
      <div className="grid gap-4 xl:grid-cols-2">
        <StartupBlockersPanel blockers={data?.startupBlockers ?? []} />
        <ClosureBlockersPanel blockers={data?.closureBlockers ?? []} />
      </div>
      <GenerateSyncActionsControls busy={mutations.generate.isPending || mutations.sync.isPending || mutations.createUniversalActions.isPending} onGenerate={() => mutations.generate.mutate()} onSync={(source) => mutations.sync.mutate(source)} onCreateUniversal={() => mutations.createUniversalActions.mutate()} onCustom={(values) => mutations.createCustom.mutate(values)} />
      <RequiredActionsTable actions={actions} onSelect={setSelected} onUpdate={(actionId, values) => mutations.update.mutate({ actionId, values })} />
      <ActionGroupPanels actions={actions} />
      <EvidenceVerificationStatus actions={actions} />
      <TrafficLightClosureChecklist items={data?.closureChecklist ?? []} onRecalculate={() => mutations.recalculateChecklist.mutate()} />
      <MOCActionDetailDrawer action={selected} onClose={() => setSelected(null)} onNoLongerRequired={(reason) => selected && mutations.noLongerRequired.mutate({ actionId: selected.id, reason })} />
    </div>
  );
}
