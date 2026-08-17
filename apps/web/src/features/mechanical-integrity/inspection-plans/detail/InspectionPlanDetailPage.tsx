'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInspectionPlanDetail } from '../../hooks/useInspectionPlanDetail';
import { useInspectionPlanMutations } from '../../hooks/useInspectionPlanMutations';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';
import { InspectionPlanDetailHeader } from './InspectionPlanDetailHeader';
import { InspectionPlanOverviewTab } from './InspectionPlanOverviewTab';
import { InspectionPlanScopeTab } from './InspectionPlanScopeTab';
import { InspectionPlanChecklistTab } from './InspectionPlanChecklistTab';
import { InspectionPlanScheduleTab } from './InspectionPlanScheduleTab';
import { InspectionPlanOccurrencesTab } from './InspectionPlanOccurrencesTab';
import { InspectionPlanRevisionsTab } from './InspectionPlanRevisionsTab';
import { InspectionPlanHistoryTab } from './InspectionPlanHistoryTab';

const tabs = ['overview','scope','checklist','schedule','occurrences','revisions','history'] as const;

export function InspectionPlanDetailPage({ planId, initialTab = 'overview' }: { planId: string; initialTab?: typeof tabs[number] }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>(initialTab);
  const query = useInspectionPlanDetail(planId);
  const mutations = useInspectionPlanMutations(planId);
  const router = useRouter();
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Inspection plan could not be loaded.</div>;
  const detail = query.data;
  const onAction = (key: string) => {
    if (key === 'submit') mutations.submit.mutate('Submitted from inspection plan detail');
    if (key === 'approve') mutations.approve.mutate('Approved from inspection plan detail');
    if (key === 'reject') mutations.reject.mutate(prompt('Rejection reason') ?? '');
    if (key === 'run-scheduler') mutations.recalculate.mutate();
    if (key === 'manual-override') mutations.manualOverride.mutate({ dueDate: prompt('Manual override due date YYYY-MM-DD'), reason: prompt('Override reason') });
    if (key === 'archive') mutations.archive.mutate(prompt('Archive reason') ?? '');
    if (key === 'export') window.open(`/api/v1/mechanical-integrity/inspection-plans/${planId}/export`, '_blank');
  };
  return (
    <div className="space-y-5">
      <InspectionPlanDetailHeader detail={detail} onAction={onAction} busy={Object.values(mutations).some((m: any) => m?.isPending)} />
      <div className="flex gap-2 overflow-x-auto">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold ${tab === item ? 'border-info bg-info/10 text-info' : 'border-[var(--psm-line)] text-[var(--psm-text)]'}`}>{item.replace('-', ' ')}</button>)}<button onClick={() => router.push(`/mechanical-integrity/inspection-plans/${planId}/edit`)} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)]">Edit</button></div>
      {tab === 'overview' ? <InspectionPlanOverviewTab detail={detail} /> : null}
      {tab === 'scope' ? <InspectionPlanScopeTab detail={detail} /> : null}
      {tab === 'checklist' ? <InspectionPlanChecklistTab detail={detail} /> : null}
      {tab === 'schedule' ? <InspectionPlanScheduleTab detail={detail} /> : null}
      {tab === 'occurrences' ? <InspectionPlanOccurrencesTab detail={detail} /> : null}
      {tab === 'revisions' ? <InspectionPlanRevisionsTab detail={detail} /> : null}
      {tab === 'history' ? <InspectionPlanHistoryTab detail={detail} /> : null}
    </div>
  );
}
