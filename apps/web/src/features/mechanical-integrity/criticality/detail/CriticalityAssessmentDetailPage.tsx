'use client';

import { useState } from 'react';
import { useCriticalityAssessment } from '../../hooks/useCriticalityAssessment';
import { useCriticalityMutations } from '../../hooks/useCriticalityMutations';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';
import { EquipmentSnapshotSection } from '../assessment/sections/EquipmentSnapshotSection';
import { RiskCalculationPreviewSection } from '../assessment/sections/RiskCalculationPreviewSection';
import { CriticalityAssessmentHeader } from './CriticalityAssessmentHeader';
import { CriticalityCalculationTab } from './CriticalityCalculationTab';
import { CriticalityHistoryTab } from './CriticalityHistoryTab';
import { CriticalityReviewTab } from './CriticalityReviewTab';
import { CriticalityScoresTab } from './CriticalityScoresTab';

export function CriticalityAssessmentDetailPage({ assessmentId }: { assessmentId: string }) {
  const [tab, setTab] = useState('overview');
  const query = useCriticalityAssessment(assessmentId);
  const mutations = useCriticalityMutations(assessmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Criticality assessment could not be loaded.</div>;
  const detail = query.data;
  const onAction = (key: string) => {
    if (key === 'recalculate') mutations.recalculate.mutate(undefined);
    if (key === 'submit') mutations.submit.mutate(undefined);
    if (key === 'approve') mutations.approve.mutate(undefined);
    if (key === 'reject') mutations.reject.mutate('Rejected from detail page.');
    if (key === 'return') mutations.returnForCorrection.mutate('Returned for correction.');
    if (key === 'revision') mutations.createRevision.mutate('Revision requested.');
    if (key === 'archive') mutations.archive.mutate('Archived from detail page.');
  };
  return (
    <div className="space-y-5">
      <CriticalityAssessmentHeader assessment={detail.assessment} onAction={onAction} saving={Object.values(mutations).some((mutation: any) => mutation.isPending)} />
      <div className="flex flex-wrap gap-2">{['overview','scores','calculation','review','history'].map((item) => <button key={item} className={`rounded-full border px-3 py-1 text-sm ${tab === item ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`} onClick={() => setTab(item)}>{item}</button>)}</div>
      {tab === 'overview' ? <div className="grid gap-4 lg:grid-cols-2"><EquipmentSnapshotSection snapshot={detail.assessment.equipment_snapshot_json as any} /><RiskCalculationPreviewSection calculation={detail.calculation} /></div> : null}
      {tab === 'scores' ? <CriticalityScoresTab detail={detail} /> : null}
      {tab === 'calculation' ? <CriticalityCalculationTab detail={detail} /> : null}
      {tab === 'review' ? <CriticalityReviewTab detail={detail} onSubmit={() => mutations.submit.mutate(undefined)} saving={mutations.submit.isPending} /> : null}
      {tab === 'history' ? <CriticalityHistoryTab rows={detail.history} /> : null}
    </div>
  );
}
