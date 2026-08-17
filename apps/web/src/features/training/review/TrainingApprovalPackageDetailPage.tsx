'use client';

import Link from 'next/link';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingApprovalStatusBadge } from '../shared/TrainingApprovalStatusBadge';
import { TrainingApprovalStageStatusBadge } from '../shared/TrainingApprovalStageStatusBadge';
import { TrainingValidationStatusBadge } from '../shared/TrainingValidationStatusBadge';
import { TrainingStaleApprovalBadge } from '../shared/TrainingStaleApprovalBadge';
import { useTrainingApprovalPackageDetail } from '../hooks/useTrainingApprovalPackageDetail';
import { TrainingReviewHeader } from './TrainingReviewHeader';
import { TrainingApprovalSnapshotPanel } from './TrainingApprovalSnapshotPanel';
import { TrainingApprovalEvidencePanel } from './TrainingApprovalEvidencePanel';
import { TrainingApprovalValidationPanel } from './TrainingApprovalValidationPanel';
import { TrainingApprovalStageTimeline } from './TrainingApprovalStageTimeline';
import { TrainingApprovalDecisionPanel } from './TrainingApprovalDecisionPanel';
import { TrainingApprovalCommentPanel } from './TrainingApprovalCommentPanel';
import { TrainingApprovalEsignaturePanel } from './TrainingApprovalEsignaturePanel';
import { TrainingApprovalHistoryPanel } from './TrainingApprovalHistoryPanel';

export function TrainingApprovalPackageDetailPage({ approvalId, focus = 'overview' }: { approvalId: string; focus?: string }) {
  const query = useTrainingApprovalPackageDetail(approvalId);
  if (query.isLoading) return <TrainingLoadingState rows={7} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  const req = data?.request ?? {};
  return (
    <div className="space-y-5">
      <TrainingReviewHeader title={req.approval_title ?? 'Approval Package'} subtitle={`${req.approval_code ?? approvalId} / ${req.source_module ?? 'Training'} / ${req.source_record_type ?? 'Source record'}`} onRefresh={() => query.refetch()} actions={<TrainingButton href={`/training-competency/review-approval/packages/${approvalId}/review`}>Review</TrainingButton>} />
      <nav className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2 text-sm">{['overview','review','snapshot','evidence','validation','stages','comments','esignatures','decisions','history'].map((tab) => <Link key={tab} className={`rounded-lg px-3 py-2 font-semibold ${focus === tab ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`} href={tab === 'overview' ? `/training-competency/review-approval/packages/${approvalId}` : `/training-competency/review-approval/packages/${approvalId}/${tab === 'validation' || tab === 'stages' || tab === 'comments' || tab === 'esignatures' || tab === 'decisions' ? '' : tab}`}>{tab}</Link>)}</nav>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TrainingCard><Info label="Status" value={<TrainingApprovalStatusBadge status={req.approval_status} />} /></TrainingCard>
        <TrainingCard><Info label="Validation" value={<TrainingValidationStatusBadge value={req.validation_status} />} /></TrainingCard>
        <TrainingCard><Info label="Stale status" value={<TrainingStaleApprovalBadge value={req.stale_status} />} /></TrainingCard>
        <TrainingCard><Info label="Due date" value={req.due_date ? new Date(req.due_date).toLocaleString() : 'Not set'} /></TrainingCard>
      </div>
      <TrainingCard title="Overview fields" subtitle="Immutable package identity and scope captured by the backend at submission."><dl className="grid gap-3 text-sm md:grid-cols-3">{Object.entries({ 'Source module': req.source_module, 'Source record type': req.source_record_type, 'Source record ID': req.source_record_id, 'Company / site / unit / area': [req.company_id, req.site_id, req.unit_id, req.area_id].filter(Boolean).join(' / '), 'Submitted by': req.submitted_by, 'Submitted at': req.submitted_at ? new Date(req.submitted_at).toLocaleString() : null, 'Current stage': req.current_stage_id, Priority: req.priority, 'Safety-critical': req.safety_critical ? 'Yes' : 'No', 'E-signature required': data?.stages?.some((s) => s.esign_required) ? 'Yes' : 'No', 'Stale reason': req.stale_reason, Confidentiality: req.confidentiality_level }).map(([k, v]) => <div key={k}><dt className="text-xs uppercase text-[var(--psm-muted)]">{k}</dt><dd className="mt-1 font-semibold">{typeof v === 'object' ? v : String(v ?? '-')}</dd></div>)}</dl></TrainingCard>
      <div className="grid gap-4 xl:grid-cols-2">
        <TrainingApprovalSnapshotPanel data={data} />
        <TrainingApprovalEvidencePanel rows={data?.evidence} />
        <TrainingApprovalValidationPanel rows={data?.validations} />
        <TrainingApprovalStageTimeline rows={data?.stages} />
        <TrainingApprovalDecisionPanel approvalId={approvalId} actions={data?.actions} />
        <TrainingApprovalCommentPanel approvalId={approvalId} comments={data?.comments} />
        <TrainingApprovalEsignaturePanel rows={data?.esignatures} />
        <TrainingApprovalHistoryPanel rows={data?.history} />
      </div>
    </div>
  );
}
function Info({ label, value }: { label: string; value: React.ReactNode }) { return <div><p className="text-xs uppercase text-[var(--psm-muted)]">{label}</p><div className="mt-2 font-semibold">{value}</div></div>; }
