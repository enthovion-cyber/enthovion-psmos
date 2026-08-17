'use client';

import { useState } from 'react';
import { usePssrTrainingMutations } from '../hooks/usePssrTrainingMutations';
import { usePssrTrainingReadinessDetail } from '../hooks/usePssrTrainingReadinessDetail';
import { TrainingButton, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingPssrHeader } from './TrainingPssrHeader';
import { PssrRequiredWorkersTab } from './tabs/PssrRequiredWorkersTab';
import { PssrTrainingAssignmentsTab } from './tabs/PssrTrainingAssignmentsTab';
import { PssrTrainingBlockersTab } from './tabs/PssrTrainingBlockersTab';
import { PssrTrainingEvidenceTab } from './tabs/PssrTrainingEvidenceTab';
import { PssrTrainingHistoryTab } from './tabs/PssrTrainingHistoryTab';
import { PssrTrainingImpactTab } from './tabs/PssrTrainingImpactTab';
import { PssrTrainingOverviewTab } from './tabs/PssrTrainingOverviewTab';
import { PssrTrainingReadinessTab } from './tabs/PssrTrainingReadinessTab';
import { PssrTrainingWaiversTab } from './tabs/PssrTrainingWaiversTab';

const tabs = ['Overview', 'Impact', 'Required Workers', 'Assignments', 'Evidence', 'Readiness', 'Blockers', 'Waivers', 'History'] as const;

export function TrainingPssrReadinessDetailPage({ readinessId }: { readinessId: string }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const query = usePssrTrainingReadinessDetail(readinessId);
  const mutations = usePssrTrainingMutations();
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError || !query.data) return <TrainingErrorState message={query.error ?? 'Readiness not found'} onRetry={() => query.refetch()} />;
  const detail = query.data;
  const actionDisabled = mutations.runImpactCheck.isPending || mutations.generateAssignments.isPending || mutations.runReadiness.isPending;
  return <div className="space-y-6"><TrainingPssrHeader title={detail.readiness.readiness_title ?? 'PSSR Training Readiness'} subtitle={`Linked PSSR: ${detail.readiness.pssr?.pssr_number ?? detail.readiness.pssr_id}`} /><div className="flex flex-wrap gap-2"><TrainingButton onClick={() => mutations.runImpactCheck.mutate({ readinessId })} disabled={actionDisabled} title={actionDisabled ? 'Another backend action is running.' : undefined}>Run Impact Check</TrainingButton><TrainingButton onClick={() => mutations.generateAssignments.mutate({ readinessId })} disabled={actionDisabled} title={actionDisabled ? 'Another backend action is running.' : undefined} variant="secondary">Generate Assignments</TrainingButton><TrainingButton onClick={() => mutations.runReadiness.mutate({ readinessId })} disabled={actionDisabled} title={actionDisabled ? 'Another backend action is running.' : undefined} variant="secondary">Run Readiness</TrainingButton><TrainingButton href={`/training-competency/pssr-training-readiness/${readinessId}/edit`} variant="secondary">Edit</TrainingButton></div><div className="flex gap-2 overflow-x-auto border-b border-[var(--psm-line)] pb-2">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${tab === item ? 'bg-primary text-white' : 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'}`}>{item}</button>)}</div>{tab === 'Overview' ? <PssrTrainingOverviewTab detail={detail} /> : null}{tab === 'Impact' ? <PssrTrainingImpactTab rows={detail.impactChecks} /> : null}{tab === 'Required Workers' ? <PssrRequiredWorkersTab rows={detail.requiredWorkers} /> : null}{tab === 'Assignments' ? <PssrTrainingAssignmentsTab rows={detail.assignments} /> : null}{tab === 'Evidence' ? <PssrTrainingEvidenceTab rows={detail.assignments} /> : null}{tab === 'Readiness' ? <PssrTrainingReadinessTab rows={Array.isArray(detail.readinessCheck) ? detail.readinessCheck : [detail.readinessCheck].filter(Boolean)} /> : null}{tab === 'Blockers' ? <PssrTrainingBlockersTab rows={detail.blockers} /> : null}{tab === 'Waivers' ? <PssrTrainingWaiversTab rows={detail.waivers} /> : null}{tab === 'History' ? <PssrTrainingHistoryTab rows={detail.history} /> : null}</div>;
}

