'use client';

import { useMOCStartupMutations } from '../../hooks/useMOCStartupMutations';
import { useMOCStartupReadiness } from '../../hooks/useMOCStartupReadiness';
import { DocumentReadinessPanel } from '../startup/DocumentReadinessPanel';
import { EngineeringReadinessPanel } from '../startup/EngineeringReadinessPanel';
import { LinkedPSSRRecordPanel } from '../startup/LinkedPSSRRecordPanel';
import { PSSRRequirementPanel } from '../startup/PSSRRequirementPanel';
import { ReadinessChecklist } from '../startup/ReadinessChecklist';
import { RequiredActionsBeforeStartup } from '../startup/RequiredActionsBeforeStartup';
import { StartupBlockersPanel } from '../startup/StartupBlockersPanel';
import { StartupReadinessSummaryCard } from '../startup/StartupReadinessSummaryCard';
import { StartupReleaseControls } from '../startup/StartupReleaseControls';
import { TrainingReadinessPanel } from '../startup/TrainingReadinessPanel';
import { ErrorState, LoadingState } from '../moc-detail-ui';

export function MOCPSSRStartupReadinessTab({ moc }: { moc: any }) {
  const readiness = useMOCStartupReadiness(moc.id);
  const mutations = useMOCStartupMutations(moc.id);
  if (readiness.isLoading) return <LoadingState />;
  if (readiness.isError) return <ErrorState message="Unable to load PSSR / startup readiness from API." />;
  const data = readiness.data;
  const readOnly = ['Closed', 'Cancelled'].includes(moc.status);
  return (
    <div className="space-y-4">
      <StartupReadinessSummaryCard data={data} />
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <PSSRRequirementPanel pssr={data?.pssr} />
        <LinkedPSSRRecordPanel linked={data?.linkedPssr} onTrigger={() => mutations.triggerPssr.mutate({ triggerReason: 'Triggered from startup readiness tab' })} onSync={() => mutations.syncPssr.mutate({ pssrStatus: data?.pssr?.pssr_status ?? data?.pssr?.status ?? 'Required' })} />
      </div>
      <StartupBlockersPanel blockers={data?.blockers ?? []} />
      <ReadinessChecklist checklist={data?.checklist ?? []} />
      <RequiredActionsBeforeStartup actions={data?.requiredActionsBeforeStartup ?? []} onCreate={() => mutations.createBlockerAction.mutate({ title: 'Startup readiness blocker action', description: 'Created from PSSR / Startup Readiness tab' })} />
      <div className="grid gap-4 xl:grid-cols-3">
        <TrainingReadinessPanel readiness={data?.trainingReadiness} />
        <DocumentReadinessPanel readiness={data?.documentReadiness} />
        <EngineeringReadinessPanel readiness={data?.engineeringReadiness} />
      </div>
      <StartupReleaseControls mutations={mutations} disabled={readOnly} />
    </div>
  );
}
