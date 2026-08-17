'use client';

import { useState } from 'react';
import { useSopAcknowledgementDetail } from '../hooks/useSopAcknowledgementDetail';
import { useSopAcknowledgementMutations } from '../hooks/useSopAcknowledgementMutations';
import { SopAcknowledgementStatusBadge } from '../shared/SopAcknowledgementStatusBadge';
import { SopAckVerificationStatusBadge } from '../shared/SopAckVerificationStatusBadge';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { SopAckHeader } from './SopAckHeader';

export function SopAcknowledgementDetailPage({ acknowledgementId, verifyOnly }: { acknowledgementId: string; verifyOnly?: boolean }) {
  const [reason, setReason] = useState('');
  const query = useSopAcknowledgementDetail(acknowledgementId);
  const mutations = useSopAcknowledgementMutations(acknowledgementId);
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const detail = query.data!;
  return (
    <div className="space-y-5">
      <SopAckHeader title={verifyOnly ? 'Verify SOP Acknowledgement' : 'SOP Acknowledgement Detail'} subtitle="Immutable acknowledgement evidence, version validation, e-signature, assessment, verification, waiver and history." actions={false} />
      <TrainingCard title="Acknowledgement Snapshot" action={<SopAcknowledgementStatusBadge value={detail.acknowledgement.acknowledgement_status} />}>
        <div className="grid gap-3 md:grid-cols-4">
          <Info label="Worker" value={detail.assignment.worker?.display_name ?? detail.assignment.worker_id} />
          <Info label="Requirement" value={detail.requirement.requirement_title} />
          <Info label="Acknowledged version" value={detail.acknowledgement.acknowledged_version} />
          <Info label="Current version at acknowledgement" value={detail.acknowledgement.current_version_at_acknowledgement} />
          <Info label="Acknowledged at" value={detail.acknowledgement.acknowledged_at} />
          <Info label="Method" value={detail.acknowledgement.acknowledgement_method} />
          <Info label="E-signature" value={detail.acknowledgement.esignature_status} />
          <Info label="Assessment" value={detail.acknowledgement.assessment_status} />
        </div>
      </TrainingCard>
      <SopAcknowledgementVerificationPanel reason={reason} setReason={setReason} verificationStatus={detail.acknowledgement.verification_status ?? null} onVerify={() => mutations.verify.mutate({ reason })} onReject={() => mutations.reject.mutate({ reason })} onReturn={() => mutations.returnForCorrection.mutate({ reason })} />
      <SopAcknowledgementEvidencePanel detail={detail} />
      <SopAcknowledgementAssessmentPanel detail={detail} />
      <SopAcknowledgementMatrixCompetencyPanel detail={detail} />
      <TrainingCard title="Acknowledgement history"><pre className="overflow-x-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(detail.history ?? [], null, 2)}</pre></TrainingCard>
    </div>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-lg bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{label}</p><p className="mt-1 text-sm font-semibold">{String(value ?? '-')}</p></div>;
}

export function SopAcknowledgementVerificationPanel({ verificationStatus, reason, setReason, onVerify, onReject, onReturn }: { verificationStatus?: string | null | undefined; reason: string; setReason: (value: string) => void; onVerify: () => void; onReject: () => void; onReturn: () => void }) {
  return <TrainingCard title="Verification Workflow" action={<SopAckVerificationStatusBadge value={verificationStatus ?? null} />}><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Verification comment, rejection reason, return reason, or reopen reason" className="min-h-24 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm" /><div className="mt-3 flex flex-wrap gap-2"><TrainingButton title="Verify acknowledgement evidence." onClick={onVerify}>Verify</TrainingButton><TrainingButton variant="danger" disabled={!reason.trim()} title={!reason.trim() ? 'Reject requires a reason.' : 'Reject acknowledgement evidence.'} onClick={onReject}>Reject</TrainingButton><TrainingButton variant="secondary" disabled={!reason.trim()} title={!reason.trim() ? 'Return requires a reason.' : 'Return acknowledgement for correction.'} onClick={onReturn}>Return</TrainingButton></div></TrainingCard>;
}

export function SopAcknowledgementEvidencePanel({ detail }: { detail: any }) {
  return <TrainingCard title="Evidence / E-Signature"><pre className="overflow-x-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify({ assignment: detail.assignment, acknowledgement: detail.acknowledgement }, null, 2)}</pre></TrainingCard>;
}

export function SopAcknowledgementAssessmentPanel({ detail }: { detail: any }) {
  return <TrainingCard title="Assessment / Quiz Evidence"><pre className="overflow-x-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify({ assessment_status: detail.acknowledgement.assessment_status }, null, 2)}</pre></TrainingCard>;
}

export function SopAcknowledgementMatrixCompetencyPanel({ detail }: { detail: any }) {
  return <TrainingCard title="Training Matrix / Competency Evidence"><pre className="overflow-x-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify({ matrix_sync: detail.requirement.sync_to_matrix, competency_sync: detail.requirement.sync_to_competency, waivers: detail.waivers }, null, 2)}</pre></TrainingCard>;
}
