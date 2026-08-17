'use client';

import { useQuery } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMocHeader } from './TrainingMocHeader';
import { MocTrainingAssignmentTable } from './MocTrainingAssignmentTable';
import { MocTrainingBlockerTable } from './MocTrainingBlockerTable';
import { MocTrainingImpactChecklist } from './MocTrainingImpactChecklist';
import { MocTrainingReadinessPanel } from './MocTrainingReadinessPanel';
import { TrainingMocRequirementTable } from './TrainingMocRequirementTable';

export function MocTrainingMocScopePage({ mocId, view }: { mocId: string; view: 'requirements' | 'readiness' | 'blockers' | 'evidence' | 'impact-check' }) {
  const query = useQuery({ queryKey: ['training', 'moc', 'moc-scope', mocId, view], queryFn: () => view === 'readiness' ? mocTrainingService.mocReadiness(mocId) : view === 'blockers' ? mocTrainingService.mocBlockers(mocId) : view === 'evidence' ? mocTrainingService.mocEvidence(mocId) : view === 'impact-check' ? mocTrainingService.mocImpactCheck(mocId) : mocTrainingService.mocRequirements(mocId), enabled: Boolean(mocId) });
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data as any;
  return <div className="space-y-6"><TrainingMocHeader title={`MOC Training ${view.replace('-', ' ')}`} subtitle={`MOC scope: ${mocId}`} />{view === 'readiness' ? <MocTrainingReadinessPanel latest={data.latest ?? data.rows?.[0]} /> : null}{view === 'blockers' ? <TrainingCard title="MOC Training Blockers"><MocTrainingBlockerTable rows={data.rows ?? []} /></TrainingCard> : null}{view === 'evidence' ? <TrainingCard title="MOC Training Evidence"><MocTrainingAssignmentTable rows={data.rows ?? []} /></TrainingCard> : null}{view === 'impact-check' ? <MocTrainingImpactChecklist latest={data.latest ?? data.rows?.[0]} /> : null}{view === 'requirements' ? <TrainingCard title="MOC Training Requirements"><TrainingMocRequirementTable rows={data.rows ?? []} /></TrainingCard> : null}</div>;
}
