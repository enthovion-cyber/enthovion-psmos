'use client';

import { usePSSRTrainingMutations } from '../../hooks/usePSSRTrainingMutations';
import { usePSSRTrainingReadiness } from '../../hooks/usePSSRTrainingReadiness';
import { BriefingAcknowledgementTracker } from '../training/BriefingAcknowledgementTracker';
import { GenerateSyncTrainingControls } from '../training/GenerateSyncTrainingControls';
import { PersonnelReadinessTable } from '../training/PersonnelReadinessTable';
import { RequiredTrainingMatrix } from '../training/RequiredTrainingMatrix';
import { RoleBasedReadinessPanel } from '../training/RoleBasedReadinessPanel';
import { StartupTrainingBlockersPanel } from '../training/StartupTrainingBlockersPanel';
import { TrainingEvidencePanel } from '../training/TrainingEvidencePanel';
import { TrainingReadinessSummaryCard } from '../training/TrainingReadinessSummaryCard';
import { ErrorState, LoadingState } from '../pssr-ui';

export function PSSRTrainingPersonnelReadinessTab({ pssr }: { pssr: any }) {
  const query = usePSSRTrainingReadiness(pssr.id);
  const mutations = usePSSRTrainingMutations(pssr.id);
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Unable to load training readiness from API." />;
  const data = query.data ?? {};
  const busy = mutations.generate.isPending || mutations.syncFromMoc.isPending || mutations.syncFromDocuments.isPending;
  return (
    <div className="space-y-4">
      <GenerateSyncTrainingControls busy={busy} onGenerate={() => mutations.generate.mutate()} onSyncMoc={() => mutations.syncFromMoc.mutate()} onSyncDocuments={() => mutations.syncFromDocuments.mutate()} />
      <TrainingReadinessSummaryCard summary={data.summary} />
      <div className="grid gap-4 xl:grid-cols-[1.4fr_.9fr]">
        <RequiredTrainingMatrix requirements={data.requirements ?? []} />
        <StartupTrainingBlockersPanel blockers={data.blockers ?? []} />
      </div>
      <PersonnelReadinessTable assignments={data.assignments ?? []} requirements={data.requirements ?? []} onComplete={(id) => mutations.complete.mutate(id)} onVerify={(id) => mutations.verify.mutate(id)} />
      <div className="grid gap-4 xl:grid-cols-2">
        <RoleBasedReadinessPanel roles={data.roleReadiness ?? []} />
        <BriefingAcknowledgementTracker acknowledgements={data.acknowledgements ?? []} briefings={data.briefings ?? []} onAcknowledge={(id) => mutations.acknowledge.mutate(id)} />
      </div>
      <TrainingEvidencePanel evidence={data.evidence ?? []} />
    </div>
  );
}
