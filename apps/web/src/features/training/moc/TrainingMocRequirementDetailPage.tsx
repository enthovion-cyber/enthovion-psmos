'use client';

import { useState } from 'react';
import { useMocTrainingMutations } from '../hooks/useMocTrainingMutations';
import { useMocTrainingRequirementDetail } from '../hooks/useMocTrainingRequirementDetail';
import { TrainingButton, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMocHeader } from './TrainingMocHeader';
import { MocAffectedWorkersTab } from './tabs/MocAffectedWorkersTab';
import { MocTrainingAssignmentsTab } from './tabs/MocTrainingAssignmentsTab';
import { MocTrainingBlockersTab } from './tabs/MocTrainingBlockersTab';
import { MocTrainingEvidenceTab } from './tabs/MocTrainingEvidenceTab';
import { MocTrainingHistoryTab } from './tabs/MocTrainingHistoryTab';
import { MocTrainingImpactTab } from './tabs/MocTrainingImpactTab';
import { MocTrainingOverviewTab } from './tabs/MocTrainingOverviewTab';
import { MocTrainingReadinessTab } from './tabs/MocTrainingReadinessTab';
import { MocTrainingWaiversTab } from './tabs/MocTrainingWaiversTab';

const tabs = ['Overview', 'Impact', 'Affected Workers', 'Assignments', 'Evidence', 'Readiness', 'Blockers', 'Waivers', 'History'] as const;

export function TrainingMocRequirementDetailPage({ requirementId }: { requirementId: string }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const query = useMocTrainingRequirementDetail(requirementId);
  const mutations = useMocTrainingMutations();
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError || !query.data) return <TrainingErrorState message={query.error ?? 'Requirement not found'} onRetry={() => query.refetch()} />;
  const detail = query.data;
  const actionDisabled = mutations.runImpactCheck.isPending || mutations.generateAssignments.isPending || mutations.runReadiness.isPending;
  return <div className="space-y-6"><TrainingMocHeader title={detail.requirement.requirement_title ?? 'MOC Training Requirement'} subtitle={`Linked MOC: ${detail.requirement.moc?.moc_number ?? detail.requirement.moc_id}`} /><div className="flex flex-wrap gap-2"><TrainingButton onClick={() => mutations.runImpactCheck.mutate({ requirementId })} disabled={actionDisabled} title={actionDisabled ? 'Another backend action is running.' : undefined}>Run Impact Check</TrainingButton><TrainingButton onClick={() => mutations.generateAssignments.mutate({ requirementId })} disabled={actionDisabled} title={actionDisabled ? 'Another backend action is running.' : undefined} variant="secondary">Generate Assignments</TrainingButton><TrainingButton onClick={() => mutations.runReadiness.mutate({ requirementId })} disabled={actionDisabled} title={actionDisabled ? 'Another backend action is running.' : undefined} variant="secondary">Run Readiness</TrainingButton><TrainingButton href={`/training-competency/moc-training-requirements/${requirementId}/edit`} variant="secondary">Edit</TrainingButton></div><div className="flex gap-2 overflow-x-auto border-b border-[var(--psm-line)] pb-2">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${tab === item ? 'bg-primary text-white' : 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'}`}>{item}</button>)}</div>{tab === 'Overview' ? <MocTrainingOverviewTab detail={detail} /> : null}{tab === 'Impact' ? <MocTrainingImpactTab rows={detail.impactChecks} /> : null}{tab === 'Affected Workers' ? <MocAffectedWorkersTab rows={detail.affectedWorkers} /> : null}{tab === 'Assignments' ? <MocTrainingAssignmentsTab rows={detail.assignments} /> : null}{tab === 'Evidence' ? <MocTrainingEvidenceTab rows={detail.assignments} /> : null}{tab === 'Readiness' ? <MocTrainingReadinessTab rows={detail.readiness} /> : null}{tab === 'Blockers' ? <MocTrainingBlockersTab rows={detail.blockers} /> : null}{tab === 'Waivers' ? <MocTrainingWaiversTab rows={detail.waivers} /> : null}{tab === 'History' ? <MocTrainingHistoryTab rows={detail.history} /> : null}</div>;
}
