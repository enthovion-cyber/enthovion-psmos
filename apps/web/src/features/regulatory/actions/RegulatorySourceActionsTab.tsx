'use client';

import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryActionSource } from '../hooks/useRegulatoryActions';
import { useRegulatoryActionReadiness } from '../hooks/useRegulatoryActionReadiness';
import { ActionSummaryCards, ReadinessPanel, RegulatoryActionTable } from './components/RegulatoryActionUi';

export function RegulatorySourceActionsTab({ sourcePath, readinessPath, title = 'Regulatory Actions / CAPA' }: { sourcePath: string; readinessPath?: string; title?: string }) {
  const actions = useRegulatoryActionSource(sourcePath);
  const readiness = useRegulatoryActionReadiness(readinessPath ?? `${sourcePath}/closure-readiness`);
  if (actions.isLoading) return <RegulatoryLoadingState rows={4} />;
  if (actions.isError) return <RegulatoryErrorState message={actions.error} onRetry={() => actions.refetch()} />;
  return (
    <div className="space-y-5">
      <RegulatoryCard title={title} subtitle="Action links are sourced from the Phase 7 backend integration, not placeholders.">
        <ActionSummaryCards summary={actions.data?.summary} />
      </RegulatoryCard>
      <ReadinessPanel readiness={readiness.data as Record<string, unknown> | undefined} />
      <RegulatoryActionTable rows={actions.data?.rows} onRefresh={() => { void actions.refetch(); void readiness.refetch(); }} />
    </div>
  );
}
