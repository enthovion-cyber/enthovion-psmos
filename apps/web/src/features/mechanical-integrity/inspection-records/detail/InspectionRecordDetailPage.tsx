'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInspectionRecordDetail } from '../../hooks/useInspectionRecordDetail';
import { useInspectionRecordMutations } from '../../hooks/useInspectionRecordMutations';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';
import { InspectionCalculationPreviewSection } from '../sections/InspectionCalculationPreviewSection';
import { InspectionDocumentsEvidenceSection } from '../sections/InspectionDocumentsEvidenceSection';
import { InspectionChecklistTab } from './InspectionChecklistTab';
import { InspectionFindingsTab } from './InspectionFindingsTab';
import { InspectionReadingsTab } from './InspectionReadingsTab';
import { InspectionRecordDetailHeader } from './InspectionRecordDetailHeader';
import { InspectionReportTab } from './InspectionReportTab';
import { InspectionReviewTab } from './InspectionReviewTab';

const tabs = ['Overview', 'Checklist', 'UT Readings', 'Findings', 'Calculations', 'Evidence', 'Review', 'Report'] as const;

export function InspectionRecordDetailPage({ inspectionId }: { inspectionId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const query = useInspectionRecordDetail(inspectionId);
  const mutations = useInspectionRecordMutations(inspectionId, query.data?.record.equipment_id);
  const saving = useMemo(() => Object.values(mutations).some((mutation: any) => mutation.isPending), [mutations]);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Inspection record could not be loaded.</div>;
  const detail = query.data;
  return (
    <div className="space-y-5">
      <InspectionRecordDetailHeader record={detail.record} onBack={() => router.push('/mechanical-integrity/inspections')} onEdit={() => router.push(`/mechanical-integrity/inspections/${inspectionId}/edit`)} />
      <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2"><div className="flex min-w-max gap-2">{tabs.map((item) => <button key={item} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === item ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`} onClick={() => setTab(item)}>{item}</button>)}</div></div>
      {tab === 'Overview' ? <div className="grid gap-5 xl:grid-cols-2"><InspectionChecklistTab rows={detail.checklist} onUpdate={(itemId, input) => mutations.updateChecklist.mutate({ itemId, input })} saving={saving} /><InspectionReadingsTab rows={detail.readings} onAdd={(input) => mutations.addReading.mutate(input)} onApprove={(readingId) => mutations.approveReading.mutate(readingId)} saving={saving} /><InspectionFindingsTab rows={detail.findings} onAdd={(input) => mutations.addFinding.mutate(input)} onClose={(findingId) => mutations.closeFinding.mutate({ findingId, reason: 'Closed from inspection detail.' })} saving={saving} /><InspectionCalculationPreviewSection data={detail.calculations} onRecalculate={() => mutations.recalculate.mutate()} saving={saving} /></div> : null}
      {tab === 'Checklist' ? <InspectionChecklistTab rows={detail.checklist} onUpdate={(itemId, input) => mutations.updateChecklist.mutate({ itemId, input })} saving={saving} /> : null}
      {tab === 'UT Readings' ? <InspectionReadingsTab rows={detail.readings} onAdd={(input) => mutations.addReading.mutate(input)} onApprove={(readingId) => mutations.approveReading.mutate(readingId)} saving={saving} /> : null}
      {tab === 'Findings' ? <InspectionFindingsTab rows={detail.findings} onAdd={(input) => mutations.addFinding.mutate(input)} onClose={(findingId) => mutations.closeFinding.mutate({ findingId, reason: 'Closed from inspection detail.' })} saving={saving} /> : null}
      {tab === 'Calculations' ? <InspectionCalculationPreviewSection data={detail.calculations} onRecalculate={() => mutations.recalculate.mutate()} saving={saving} /> : null}
      {tab === 'Evidence' ? <InspectionDocumentsEvidenceSection rows={detail.documents} onAdd={(input) => mutations.addDocument.mutate(input)} saving={saving} /> : null}
      {tab === 'Review' ? <InspectionReviewTab reviews={detail.reviews} blockers={detail.validation.blockers} warnings={detail.validation.warnings} readOnlyReason={detail.readOnlyReason} onSubmit={() => mutations.submit.mutate(undefined)} onApprove={() => mutations.approve.mutate({ result: detail.record.result ?? 'Pass', findingsAcknowledged: true, criticalAlertsAcknowledged: true })} onReject={() => mutations.reject.mutate('Rejected from inspection review.')} saving={saving} /> : null}
      {tab === 'Report' ? <InspectionReportTab detail={detail} /> : null}
    </div>
  );
}
