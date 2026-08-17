'use client';

import { useQuery } from '@tanstack/react-query';
import { pssrTrainingService } from '../services/pssr-training.service';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingPssrHeader } from './TrainingPssrHeader';
import { PssrTrainingAssignmentTable } from './PssrTrainingAssignmentTable';
import { PssrTrainingBlockerTable } from './PssrTrainingBlockerTable';
import { PssrTrainingImpactChecklist } from './PssrTrainingImpactChecklist';
import { PssrTrainingReadinessPanel } from './PssrTrainingReadinessPanel';
import { TrainingPssrReadinessTable } from './TrainingPssrReadinessTable';

export function PssrTrainingPssrScopePage({ pssrId, view }: { pssrId: string; view: 'requirements' | 'readiness' | 'blockers' | 'evidence' | 'impact' }) {
  const query = useQuery({ queryKey: ['training', 'pssr', 'pssr-scope', pssrId, view], queryFn: () => view === 'readiness' ? pssrTrainingService.pssrReadiness(pssrId) : view === 'blockers' ? pssrTrainingService.pssrBlockers(pssrId) : view === 'evidence' ? pssrTrainingService.pssrEvidence(pssrId) : view === 'impact' ? pssrTrainingService.pssrImpactCheck(pssrId) : pssrTrainingService.pssrReadinessRecords(pssrId), enabled: Boolean(pssrId) });
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data as any;
  return <div className="space-y-6"><TrainingPssrHeader title={`PSSR Training ${view.replace('-', ' ')}`} subtitle={`PSSR scope: ${pssrId}`} />{view === 'readiness' ? <PssrTrainingReadinessPanel latest={data.latest ?? data.rows?.[0]} /> : null}{view === 'blockers' ? <TrainingCard title="PSSR Training Blockers"><PssrTrainingBlockerTable rows={data.rows ?? []} /></TrainingCard> : null}{view === 'evidence' ? <TrainingCard title="PSSR Training Evidence"><PssrTrainingAssignmentTable rows={data.rows ?? []} /></TrainingCard> : null}{view === 'impact' ? <PssrTrainingImpactChecklist latest={data.latest ?? data.rows?.[0]} /> : null}{view === 'requirements' ? <TrainingCard title="PSSR Training Requirements"><TrainingPssrReadinessTable rows={data.rows ?? []} /></TrainingCard> : null}</div>;
}

