'use client';

import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { useRegulatoryReviewMutations, useRegulatoryReviewPackageDetail } from '../hooks/useRegulatoryReviewPackages';
import { RegulatoryReviewDecisionBadge } from '../shared/RegulatoryReviewDecisionBadge';
import { RegulatoryReviewESignBadge } from '../shared/RegulatoryReviewESignBadge';
import { RegulatoryReviewStaleBadge } from '../shared/RegulatoryReviewStaleBadge';
import { RegulatoryReviewStatusBadge } from '../shared/RegulatoryReviewStatusBadge';
import { RegulatoryReviewValidationBadge } from '../shared/RegulatoryReviewValidationBadge';
import { RegulatoryButton, RegulatoryCard, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryField, RegulatoryLoadingState, regulatoryInputClass } from '../shared/RegulatoryUi';

export function RegulatoryReviewPackageDetailPage({ approvalId, tab = 'overview' }: { approvalId: string; tab?: string | undefined }) {
  const query = useRegulatoryReviewPackageDetail(approvalId);
  const mutations = useRegulatoryReviewMutations(approvalId);
  const [reason, setReason] = useState('');
  if (query.isLoading) return <RegulatoryLoadingState />;
  if (query.isError) return <RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} />;
  const detail = query.data;
  const pkg = detail?.package;
  if (!pkg) return <RegulatoryEmptyState title="Review package not found" message="The package may be outside your company/site scope or has been archived." />;
  const permissions = detail?.permissions ?? {};
  const locked = ['Approved', 'Approved With Conditions', 'Completed', 'Archived'].includes(String(pkg.review_status));
  const disabledReason = locked ? 'Approved/completed packages are immutable. Create a refreshed package or controlled revision.' : undefined;
  const actionReason = reason || 'Decision recorded from Regulatory Review & Approval tab.';
  return (
    <div className="space-y-6">
      <RegulatoryHeader title={pkg.package_title ?? 'Review Package'} subtitle={`${pkg.package_code ?? pkg.id} - ${pkg.source_type ?? 'Source'} - ${pkg.source_record_number ?? pkg.source_record_id ?? ''}`} onRefresh={() => query.refetch()} action={<RegulatoryButton href="/regulatory/review-approval/packages">Back to Register</RegulatoryButton>} />
      {pkg.stale_status && pkg.stale_status !== 'Current' ? <RegulatoryCard title="Stale Package Warning" subtitle={pkg.stale_reason ?? 'Source changed after submission. Refresh snapshot or resubmit before approval.'}><RegulatoryReviewStaleBadge status={pkg.stale_status} /></RegulatoryCard> : null}
      <div className="grid gap-3 md:grid-cols-5">
        <RegulatoryCard title="Review Status"><RegulatoryReviewStatusBadge status={pkg.review_status} /></RegulatoryCard>
        <RegulatoryCard title="Validation"><RegulatoryReviewValidationBadge status={pkg.validation_status} /></RegulatoryCard>
        <RegulatoryCard title="Decision"><RegulatoryReviewDecisionBadge decision={pkg.decision} /></RegulatoryCard>
        <RegulatoryCard title="E-Signature"><RegulatoryReviewESignBadge status={pkg.e_signature_status} /></RegulatoryCard>
        <RegulatoryCard title="Source Lock">{pkg.source_locked ? 'Locked' : 'Unlocked'}</RegulatoryCard>
      </div>
      <RegulatoryCard title="Decision Actions" subtitle="All decisions are backend-controlled, audited, and written to regulatory review history. Reject, return, and request-info require a reason.">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <RegulatoryField label="Reason / comment">
            <input className={regulatoryInputClass()} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for reject, return, request-info and useful for all decisions" />
          </RegulatoryField>
          <div className="flex flex-wrap items-end gap-2">
            <RegulatoryButton variant="secondary" disabled={!permissions.canSubmit || locked} title={!permissions.canSubmit ? 'Missing permission: regulatory.review.package.submit' : disabledReason} onClick={() => mutations.submit.mutate({ reason: actionReason })}>Submit</RegulatoryButton>
            <RegulatoryButton disabled={!permissions.canApprove || locked || pkg.stale_status !== 'Current'} title={!permissions.canApprove ? 'Missing permission: regulatory.review.decision.approve' : pkg.stale_status !== 'Current' ? 'Stale packages cannot be approved.' : disabledReason} onClick={() => mutations.approve.mutate({ reason: actionReason })}>Approve</RegulatoryButton>
            <RegulatoryButton variant="secondary" disabled={!permissions.canReturn || locked || !reason} title={!permissions.canReturn ? 'Missing permission: regulatory.review.decision.return' : !reason ? 'Return requires a reason.' : disabledReason} onClick={() => mutations.returnForCorrection.mutate({ reason })}>Return</RegulatoryButton>
            <RegulatoryButton variant="danger" disabled={!permissions.canReject || locked || !reason} title={!permissions.canReject ? 'Missing permission: regulatory.review.decision.reject' : !reason ? 'Reject requires a reason.' : disabledReason} onClick={() => mutations.reject.mutate({ reason })}>Reject</RegulatoryButton>
            <RegulatoryButton variant="secondary" disabled={!permissions.canESign || !pkg.e_signature_required} title={!permissions.canESign ? 'Missing permission: regulatory.review.esign.sign' : !pkg.e_signature_required ? 'E-signature is not required.' : undefined} onClick={() => mutations.eSign.mutate({ reason: actionReason, signatureMeaning: 'Regulatory review approval' })}>E-Sign</RegulatoryButton>
            <RegulatoryButton variant="secondary" onClick={() => mutations.runValidation.mutate({ reason: actionReason })}>Run Validation</RegulatoryButton>
            <RegulatoryButton variant="secondary" onClick={() => mutations.refreshSnapshot.mutate({ reason: actionReason })}>Refresh Snapshot</RegulatoryButton>
          </div>
        </div>
      </RegulatoryCard>
      <div className="grid gap-4 xl:grid-cols-2">
        <RegulatoryCard title="Validation Results"><JsonList rows={detail?.validation ?? []} empty="No validation results have been generated." /></RegulatoryCard>
        <RegulatoryCard title="Workflow Stages"><JsonList rows={detail?.stages ?? []} empty="No workflow stages have been configured." /></RegulatoryCard>
        <RegulatoryCard title="Decisions"><JsonList rows={detail?.decisions ?? []} empty="No decisions recorded yet." /></RegulatoryCard>
        <RegulatoryCard title="Conditions"><JsonList rows={detail?.conditions ?? []} empty="No approval conditions are open." /></RegulatoryCard>
        <RegulatoryCard title="E-Signatures"><JsonList rows={detail?.eSignatures ?? []} empty="No e-signature records linked." /></RegulatoryCard>
        <RegulatoryCard title="History"><JsonList rows={detail?.history ?? []} empty="No review history events yet." /></RegulatoryCard>
      </div>
      <RegulatoryCard title={`${tab[0]?.toUpperCase() ?? 'O'}${tab.slice(1)} Snapshot`} subtitle="Immutable source snapshot and tab data come from the backend package payload.">
        <pre className="max-h-[520px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-fg)]">{JSON.stringify(tab === 'source' ? detail?.source : tab === 'snapshot' ? detail?.snapshot : detail?.overview, null, 2)}</pre>
      </RegulatoryCard>
    </div>
  );
}

function JsonList({ rows, empty }: { rows: Array<Record<string, unknown>>; empty: string }) {
  if (!rows.length) return <p className="text-sm text-[var(--psm-muted)]">{empty}</p>;
  return <div className="space-y-3">{rows.slice(0, 8).map((row, index) => <pre key={String(row.id ?? index)} className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-fg)]">{JSON.stringify(row, null, 2)}</pre>)}</div>;
}
