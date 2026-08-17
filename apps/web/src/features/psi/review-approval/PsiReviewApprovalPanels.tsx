'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PsiButton, PsiCard, PsiEmptyState, PsiErrorState, PsiLoadingState, PsiMetricCard, PsiProgress } from '../shared/PsiUi';
import { ApprovalStaleBadge, ESignatureStatusBadge, PsiApprovalStageBadge, PsiApprovalStatusBadge, PsiDecisionBadge, PsiValidationStatusBadge, ReviewOverdueBadge } from '../shared/PsiReviewBadges';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';
import { usePsiApprovalDetail } from '../hooks/usePsiApprovalDetail';
import { usePsiApprovalMutations } from '../hooks/usePsiApprovalMutations';
import { usePsiApprovalRequests } from '../hooks/usePsiApprovalRequests';
import { usePsiApprovalRules } from '../hooks/usePsiApprovalRules';
import { usePsiApprovalSettings } from '../hooks/usePsiApprovalSettings';
import { usePsiReviewDashboard } from '../hooks/usePsiReviewDashboard';
import type { PsiApprovalDashboard, PsiApprovalDetail, PsiApprovalPaged, PsiApprovalRequest, PsiApprovalRule } from '../types/psi-review-approval.types';

function text(value: unknown, fallback = 'Not set') {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

function isOverdue(row: PsiApprovalRequest) {
  return Boolean(row.due_date && new Date(row.due_date).getTime() < Date.now() && !/Approved|Rejected|Completed|Archived|Superseded/.test(String(row.approval_status ?? '')));
}

function rowsFromRecord(record?: Record<string, number>) {
  return Object.entries(record ?? {}).map(([label, value]) => ({ label, value: Number(value ?? 0) }));
}

function disabledReason(detail?: PsiApprovalDetail, action = 'action') {
  if (!detail) return `Cannot ${action}: approval data is still loading.`;
  if (detail.readOnly) return `Cannot ${action}: completed PSI approval records are immutable.`;
  const reasons = detail.permissionState?.disabledReasons ?? [];
  if (reasons.length) return reasons.join(' ');
  const blockers = (detail.validationResults ?? []).filter((row) => row.blocking && row.validation_status === 'Failed');
  if (action === 'approve' && blockers.length) return `Cannot approve: ${blockers.length} blocking validation failure(s) remain.`;
  return undefined;
}

export function PsiReviewHeader({ title = 'PSI Review & Approval', subtitle = 'Submit, validate, route, approve, lock, reopen, and audit PSI records.', onRefresh, busy }: { title?: string | undefined; subtitle?: string | undefined; onRefresh?: (() => unknown) | undefined; busy?: boolean | undefined }) {
  return (
    <div className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Process Safety Information</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--psm-fg)]">{title}</h1>
          <p className="mt-2 max-w-4xl text-sm text-[var(--psm-muted)]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PsiButton href="/process-safety-information/review-approval/inbox" variant="secondary">Inbox</PsiButton>
          <PsiButton href="/process-safety-information/review-approval/pending" variant="secondary">Pending</PsiButton>
          <PsiButton href="/process-safety-information/review-approval/rules" variant="secondary">Rules</PsiButton>
          <PsiButton href="/process-safety-information/review-approval/settings" variant="secondary">Settings</PsiButton>
          <PsiButton onClick={onRefresh} disabled={busy} title={busy ? 'Refresh is already running.' : undefined}>Refresh</PsiButton>
        </div>
      </div>
    </div>
  );
}

export function PsiReviewSummaryCards({ summary }: { summary?: Record<string, number | string | null> | undefined }) {
  const cards = [
    ['Total Pending PSI Reviews', summary?.totalPendingPsiReviews, '/process-safety-information/review-approval/pending', 'warn'],
    ['My Pending Reviews', summary?.myPendingReviews, '/process-safety-information/review-approval/inbox', 'warn'],
    ['My Submitted Records', summary?.mySubmittedRecords, '/process-safety-information/review-approval/my-submissions'],
    ['Overdue Reviews', summary?.overdueReviews, '/process-safety-information/review-approval/overdue', 'danger'],
    ['Returned Reviews', summary?.returnedReviews, '/process-safety-information/review-approval/returned', 'warn'],
    ['Rejected Reviews', summary?.rejectedReviews, '/process-safety-information/review-approval/rejected', 'danger'],
    ['Approved This Month', summary?.approvedThisMonth, '/process-safety-information/review-approval/approved', 'good'],
    ['Critical PSI Pending', summary?.criticalPsiPendingApproval, undefined, 'danger'],
    ['PSSR Blocker Pending', summary?.pssrBlockerApprovalsPending, undefined, 'danger'],
    ['MOC Required Pending', summary?.mocRequiredPsiPendingApproval, undefined, 'warn'],
    ['Validation Failures', summary?.validationFailures, '/process-safety-information/review-approval/validation-failures', 'danger'],
    ['E-Signatures Pending', summary?.eSignaturesPending, undefined, 'warn'],
    ['Escalated Reviews', summary?.escalatedReviews, '/process-safety-information/review-approval/escalated', 'danger'],
    ['Waiver Approvals Pending', summary?.waiverApprovalsPending, undefined, 'warn'],
    ['Review SLA Breaches', summary?.reviewSlaBreaches, undefined, 'danger'],
    ['Approved But Stale', summary?.recordsApprovedButNowStale, undefined, 'danger']
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, href, tone]) => <PsiMetricCard key={label} label={label} value={text(value, '0')} href={href} tone={tone as any} />)}</div>;
}

export function PsiReviewFilters({ search, onSearch }: { search: string; onSearch: (value: string) => void }) {
  return (
    <PsiCard title="Filters / Search" subtitle="Filters are sent to backend review queues and dashboard aggregations.">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search PSI module, record title, approval type..." className="min-h-10 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-sm outline-none focus:border-primary" />
        <PsiButton href="/process-safety-information/review-approval/validation-failures" variant="secondary">Validation Failures</PsiButton>
        <PsiButton href="/process-safety-information/review-approval/export" variant="secondary" disabled title="Use the backend export endpoint from table actions to download CSV.">Export CSV</PsiButton>
      </div>
    </PsiCard>
  );
}

export function PsiApprovalRegisterTable({ rows }: { rows: PsiApprovalRequest[] }) {
  if (!rows.length) return <PsiEmptyState title="No PSI approvals found" message="There are no review requests matching the current filters. Submit a PSI record for review to populate this register." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
      <table className="min-w-[1250px] w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-wide text-[var(--psm-muted)]">
          <tr>{['Record', 'Module', 'Status', 'Stage', 'Validation', 'Completeness', 'Conflict', 'Criticality', 'MOC', 'PSSR', 'Due', 'Stale', 'Actions'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id} className="align-top hover:bg-[var(--psm-surface-2)]">
              <td className="px-3 py-3 font-semibold"><Link href={`/process-safety-information/review-approval/${row.id}`} className="text-primary hover:underline">{text(row.psi_record_title)}</Link><div className="text-xs text-[var(--psm-muted)]">{text(row.psi_record_id)}</div></td>
              <td className="px-3 py-3">{text(row.psi_module)}</td>
              <td className="px-3 py-3"><PsiApprovalStatusBadge value={row.approval_status} /></td>
              <td className="px-3 py-3"><PsiApprovalStageBadge value={row.current_stage_name ?? row.current_stage_id} /><div className="mt-1 text-xs text-[var(--psm-muted)]">{text(row.current_stage_required_role, '')}</div></td>
              <td className="px-3 py-3"><PsiValidationStatusBadge value={row.validation_status} /></td>
              <td className="px-3 py-3">{text(row.completeness_status)}</td>
              <td className="px-3 py-3">{text(row.conflict_status)}</td>
              <td className="px-3 py-3">{text(row.criticality)}</td>
              <td className="px-3 py-3"><MocRequiredBadge value={row.moc_required} /></td>
              <td className="px-3 py-3"><PssrBlockerBadge value={row.pssr_blocker} /></td>
              <td className="px-3 py-3"><ReviewOverdueBadge overdue={isOverdue(row)} /><div className="mt-1 text-xs text-[var(--psm-muted)]">{text(row.due_date, 'No due date')}</div></td>
              <td className="px-3 py-3"><ApprovalStaleBadge stale={row.stale_approval} /></td>
              <td className="px-3 py-3"><div className="flex flex-wrap gap-2"><PsiButton href={`/process-safety-information/review-approval/${row.id}/review`} variant="secondary">Open Review</PsiButton><PsiButton href={`/process-safety-information/review-approval/${row.id}/snapshot`} variant="secondary">Snapshot</PsiButton></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PsiApprovalInboxTable({ rows }: { rows: PsiApprovalRequest[] }) {
  return <PsiApprovalRegisterTable rows={rows} />;
}

export function PsiDashboardCharts({ dashboard }: { dashboard?: PsiApprovalDashboard | undefined }) {
  const charts = dashboard?.charts ?? {};
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <PsiCard title="Pending Reviews By PSI Module"><MiniBars rows={rowsFromRecord(charts.pendingByModule)} /></PsiCard>
      <PsiCard title="Records Stuck By Workflow Stage"><MiniBars rows={rowsFromRecord(charts.workflowStages)} /></PsiCard>
      <PsiCard title="Critical Approvals By Status"><MiniBars rows={rowsFromRecord(charts.criticalByStatus)} /></PsiCard>
    </div>
  );
}

export function PsiApprovalDetailHeader({ detail, onRefresh }: { detail?: PsiApprovalDetail | undefined; onRefresh?: (() => unknown) | undefined }) {
  const approval = detail?.approval;
  return (
    <PsiCard title={text(approval?.psi_record_title, 'PSI Approval Detail')} subtitle={`${text(approval?.psi_module)} / ${text(approval?.approval_type)}`} action={<PsiButton onClick={onRefresh} variant="secondary">Refresh</PsiButton>}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Field label="Status" value={<PsiApprovalStatusBadge value={approval?.approval_status} />} />
        <Field label="Validation" value={<PsiValidationStatusBadge value={approval?.validation_status} />} />
        <Field label="Current stage" value={<PsiApprovalStageBadge value={approval?.current_stage_name ?? approval?.current_stage_id} />} />
        <Field label="MOC" value={<MocRequiredBadge value={approval?.moc_required} />} />
        <Field label="PSSR" value={<PssrBlockerBadge value={approval?.pssr_blocker} />} />
        <Field label="Stale" value={<ApprovalStaleBadge stale={approval?.stale_approval} />} />
      </div>
    </PsiCard>
  );
}

export function PsiApprovalPackagePanel({ detail }: { detail?: PsiApprovalDetail | undefined }) {
  const pkg = detail?.package ?? {};
  return (
    <PsiCard title="Approval Package" subtitle="Immutable submission package assembled by the backend.">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Submitted by" value={pkg.submittedBy} />
        <Field label="Submitted at" value={pkg.submittedAt} />
        <Field label="Reason" value={pkg.reasonForReview} />
        <Field label="Completeness" value={pkg.completenessStatus} />
        <Field label="Conflict" value={pkg.conflictStatus} />
        <Field label="E-signature status" value={<ESignatureStatusBadge value={String(pkg.eSignatureStatus ?? '')} />} />
      </div>
    </PsiCard>
  );
}

export function PsiApprovalValidationPanel({ rows = [] }: { rows?: PsiApprovalDetail['validationResults'] | undefined }) {
  return (
    <PsiCard title="Validation Failures / Readiness" subtitle="Backend-generated completeness, conflict, MOC/PSSR, document, and stale-package checks.">
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{text(row.validation_title)}</p>
              <PsiValidationStatusBadge value={row.validation_status} />
            </div>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">{text(row.message)}</p>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">Severity: {text(row.severity)} / Blocking: {row.blocking ? 'Yes' : 'No'}</p>
          </div>
        ))}
        {!rows.length ? <PsiEmptyState title="No validation results" message="Run validation to generate readiness, completeness, conflict, MOC/PSSR, document, and stale-package checks." /> : null}
      </div>
    </PsiCard>
  );
}

export function PsiApprovalSnapshotPanel({ snapshots = [] }: { snapshots?: PsiApprovalDetail['snapshots'] | undefined }) {
  return (
    <PsiCard title="Approval Snapshot" subtitle="Before/after data, document evidence, linked records, completeness, and conflict snapshots.">
      <div className="grid gap-3">
        {snapshots.slice(0, 3).map((snapshot) => <pre key={snapshot.id} className="max-h-72 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(snapshot, null, 2)}</pre>)}
        {!snapshots.length ? <PsiEmptyState title="No snapshots captured" message="Snapshots are created when PSI records are submitted and finally approved." /> : null}
      </div>
    </PsiCard>
  );
}

export function PsiApprovalDiffViewer({ diff }: { diff?: Record<string, unknown> | null | undefined }) {
  return <PsiCard title="Human-Readable Diff" subtitle="Backend-generated changed fields from source record snapshots."><pre className="max-h-72 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(diff ?? { changedFields: [], message: 'No diff available.' }, null, 2)}</pre></PsiCard>;
}

export function PsiApprovalStageTimeline({ stages = [] }: { stages?: PsiApprovalDetail['stages'] | undefined }) {
  return (
    <PsiCard title="Review Workflow Timeline" subtitle="Owner, discipline, operations, HSE/process safety, MI/electrical/relief, and final approval stages where configured.">
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.id} className="flex gap-3 rounded-lg border border-[var(--psm-line)] p-3">
            <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
            <div className="flex-1">
              <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">{text(stage.stage_name)}</p><PsiApprovalStageBadge value={stage.stage_status} /></div>
              <p className="text-sm text-[var(--psm-muted)]">{text(stage.required_role)} / Assigned: {text(stage.assigned_user_id, 'Unassigned')}</p>
              <p className="text-xs text-[var(--psm-muted)]">Due: {text(stage.due_date, 'No due date')} / Decision: {text(stage.decision, 'Pending')}</p>
            </div>
          </div>
        ))}
        {!stages.length ? <PsiEmptyState title="No approval stages" message="Create or apply an approval rule to generate route stages." /> : null}
      </div>
    </PsiCard>
  );
}

export function PsiApprovalDecisionPanel({ detail }: { detail?: PsiApprovalDetail | undefined }) {
  const mutation = usePsiApprovalMutations();
  const approvalId = detail?.approval?.id ?? '';
  const approveReason = disabledReason(detail, 'approve');
  const actionReason = disabledReason(detail, 'perform this action');
  return (
    <PsiCard title="Decision Actions" subtitle="Backend-controlled approve, reject, return, delegate, escalate, override, withdraw, and validation actions.">
      <div className="flex flex-wrap gap-2">
        <PsiButton disabled={Boolean(approveReason) || mutation.isPending} title={approveReason} onClick={() => mutation.mutate({ action: 'approve', approvalId })}>Approve</PsiButton>
        <PsiButton variant="danger" disabled={Boolean(actionReason) || mutation.isPending} title={actionReason} onClick={() => mutation.mutate({ action: 'reject', approvalId, data: { reason: 'Rejected from review panel.' } })}>Reject</PsiButton>
        <PsiButton variant="secondary" disabled={Boolean(actionReason) || mutation.isPending} title={actionReason} onClick={() => mutation.mutate({ action: 'return', approvalId, data: { reason: 'Returned for changes from review panel.' } })}>Return for Changes</PsiButton>
        <PsiButton variant="secondary" disabled={!approvalId || mutation.isPending} onClick={() => mutation.mutate({ action: 'validate', approvalId })}>Run Validation</PsiButton>
        <PsiButton variant="secondary" disabled={Boolean(actionReason) || mutation.isPending} title={actionReason} onClick={() => mutation.mutate({ action: 'escalate', approvalId, data: { reason: 'Escalated for management attention.' } })}>Escalate</PsiButton>
        <PsiButton variant="secondary" disabled={Boolean(actionReason) || mutation.isPending} title={actionReason} onClick={() => mutation.mutate({ action: 'withdraw', approvalId, data: { reason: 'Withdrawn by submitter.' } })}>Withdraw</PsiButton>
      </div>
      {mutation.isError ? <p className="mt-3 text-sm text-danger">Decision action failed. Check permission, validation blockers, and backend audit/history connectivity.</p> : null}
    </PsiCard>
  );
}

export function PsiApprovalCommentsPanel({ comments = [], detail }: { comments?: PsiApprovalDetail['comments'] | undefined; detail?: PsiApprovalDetail | undefined }) {
  const [comment, setComment] = useState('');
  const mutation = usePsiApprovalMutations();
  const approvalId = detail?.approval?.id ?? '';
  return (
    <PsiCard title="Comments / Requests" subtitle="Review comments, evidence requests, returns, overrides, and internal notes.">
      <div className="grid gap-3">
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add comment, request evidence, or document decision rationale..." className="min-h-24 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm outline-none focus:border-primary" />
        <PsiButton disabled={!comment.trim() || mutation.isPending || !approvalId} title={!comment.trim() ? 'Comment text is required.' : undefined} onClick={() => mutation.mutate({ action: 'comment', approvalId, data: { commentText: comment, commentType: 'Comment' } }, { onSuccess: () => setComment('') })}>Add Comment</PsiButton>
        <div className="space-y-2">
          {comments.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex justify-between gap-2"><p className="font-semibold">{text(row.comment_type)}</p><span className="text-xs text-[var(--psm-muted)]">{text(row.created_at)}</span></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{text(row.comment_text)}</p></div>)}
          {!comments.length ? <PsiEmptyState title="No comments yet" message="Reviewer comments and change requests appear here." /> : null}
        </div>
      </div>
    </PsiCard>
  );
}

export function PsiApprovalHistoryPanel({ rows = [] }: { rows?: PsiApprovalDetail['history'] | undefined }) {
  return (
    <PsiCard title="Approval History" subtitle="Immutable PSI approval history linked to audit events.">
      <div className="space-y-3">
        {rows.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3"><p className="font-semibold">{text(row.event_title)}</p><p className="text-sm text-[var(--psm-muted)]">{text(row.event_description)} / {text(row.created_at)}</p></div>)}
        {!rows.length ? <PsiEmptyState title="No approval history" message="History appears after submission, validation, comments, decisions, rule changes, or settings updates." /> : null}
      </div>
    </PsiCard>
  );
}

export function PsiSubmitReviewDialog() {
  return <PsiCard title="Submit Review Dialog" subtitle="Source PSI records submit through /process-safety-information/:module/:recordId/submit-review."><p className="text-sm text-[var(--psm-muted)]">Submit buttons in each PSI module should pass module, record ID, reason, due date, and optional workflow stage assignments to the backend adapter.</p></PsiCard>;
}

export function PsiReturnReviewDialog() {
  return <DialogStub title="Return for Changes" text="Return requires a reason and preserves approval history for resubmission." />;
}

export function PsiRejectReviewDialog() {
  return <DialogStub title="Reject Review" text="Reject requires a reason and ends the approval request unless policy allows clone/resubmit." />;
}

export function PsiDelegateReviewDialog() {
  return <DialogStub title="Delegate Review" text="Delegate requires a target user with scope/permission and records audit/history." />;
}

export function PsiEscalateReviewDialog() {
  return <DialogStub title="Escalate Review" text="Escalation uses the configured escalation rule and notification adapter where available." />;
}

export function PsiApprovalRuleRegistryPage() {
  const rules = usePsiApprovalRules();
  const mutation = usePsiApprovalMutations();
  if (rules.isLoading) return <PsiLoadingState rows={5} />;
  if (rules.isError) return <PsiErrorState message="PSI approval rules could not be loaded." onRetry={() => rules.refetch()} />;
  return (
    <div className="space-y-5">
      <PsiReviewHeader title="PSI Approval Rules" subtitle="Configurable approval routing by module, criticality, MOC/PSSR impact, conflict severity, and completeness threshold." onRefresh={() => rules.refetch()} />
      <PsiButton href="/process-safety-information/review-approval/rules/new">New Rule</PsiButton>
      <PsiCard title="Rule Register" subtitle="Rule changes create audit/history and drive backend workflow routing.">
        <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-sm"><thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase text-[var(--psm-muted)]"><tr>{['Rule', 'Module', 'Scope', 'Threshold', 'E-sign', 'Delegate', 'Override', 'SLA', 'Active', 'Actions'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr></thead><tbody className="divide-y divide-[var(--psm-line)]">{(rules.data ?? []).map((rule) => <tr key={rule.id}><td className="px-3 py-3 font-semibold">{text(rule.rule_name)}</td><td className="px-3 py-3">{text(rule.psi_module)}</td><td className="px-3 py-3">{text(rule.applicability_scope)}</td><td className="px-3 py-3">{text(rule.completeness_threshold, 'Policy default')}</td><td className="px-3 py-3">{rule.required_esignature ? 'Yes' : 'No'}</td><td className="px-3 py-3">{rule.allow_delegate ? 'Yes' : 'No'}</td><td className="px-3 py-3">{rule.allow_override ? 'Yes' : 'No'}</td><td className="px-3 py-3">{text(rule.sla_hours)}</td><td className="px-3 py-3">{rule.active ? 'Active' : 'Archived'}</td><td className="px-3 py-3"><PsiButton variant="secondary" disabled={!rule.active || mutation.isPending} title={!rule.active ? 'Rule is already archived.' : undefined} onClick={() => mutation.mutate({ action: 'archiveRule', ruleId: rule.id, data: { reason: 'Archived from rule registry.' } })}>Archive</PsiButton></td></tr>)}</tbody></table></div>
      </PsiCard>
    </div>
  );
}

export function PsiApprovalRuleFormPage() {
  return (
    <div className="space-y-5">
      <PsiReviewHeader title="New PSI Approval Rule" subtitle="Create module-specific routing rules for PSI review and approval." />
      <PsiApprovalRuleForm />
    </div>
  );
}

export function PsiApprovalRuleForm() {
  return (
    <PsiCard title="Approval Rule Form" subtitle="Backend supports rule name, PSI module, applicability scope, filters, stages, e-sign, delegation, override, waiver, SLA, escalation, and active status.">
      <div className="grid gap-3 md:grid-cols-2">
        {['Rule name', 'PSI module', 'Record type', 'Applicability scope', 'Criticality filter', 'Completeness threshold', 'SLA hours', 'Escalation rule'].map((label) => <Field key={label} label={label} value="Configured through backend rule API" />)}
      </div>
    </PsiCard>
  );
}

export function PsiApprovalSettingsPage() {
  const settings = usePsiApprovalSettings();
  const mutation = usePsiApprovalMutations();
  if (settings.isLoading) return <PsiLoadingState rows={4} />;
  if (settings.isError) return <PsiErrorState message="PSI approval settings could not be loaded." onRetry={() => settings.refetch()} />;
  const data = settings.data ?? {};
  return (
    <div className="space-y-5">
      <PsiReviewHeader title="PSI Review Settings" subtitle="Company/site policy for gaps, conflicts, MOC/PSSR blockers, e-signature, stale approval, and SLA." onRefresh={() => settings.refetch()} />
      <PsiCard title="Settings Snapshot" subtitle="Settings are backend-controlled and audit logged on update.">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Block critical gaps" value={String(data.block_critical_gaps ?? true)} />
          <Field label="Block critical conflicts" value={String(data.block_critical_conflicts ?? true)} />
          <Field label="Require MOC for impacted changes" value={String(data.require_moc_for_impacted_changes ?? true)} />
          <Field label="Require PSSR clearance" value={String(data.require_pssr_clearance ?? true)} />
          <Field label="Require e-signature for critical" value={String(data.require_esignature_for_critical ?? true)} />
          <Field label="Stale after source change" value={String(data.stale_after_source_change ?? true)} />
          <Field label="Default SLA hours" value={text(data.default_sla_hours, '168')} />
        </div>
        <div className="mt-4"><PsiButton disabled={mutation.isPending} onClick={() => mutation.mutate({ action: 'updateSettings', data: { ...data, reason: 'Settings confirmed from UI.' } })}>Save Settings</PsiButton></div>
      </PsiCard>
    </div>
  );
}

export function PsiReviewDashboardPage() {
  const [search, setSearch] = useState('');
  const dashboard = usePsiReviewDashboard(search ? { search } : {});
  if (dashboard.isLoading) return <PsiLoadingState rows={7} />;
  if (dashboard.isError) return <PsiErrorState message="The PSI review dashboard could not be loaded." onRetry={() => dashboard.refetch()} />;
  return (
    <div className="space-y-5">
      <PsiReviewHeader onRefresh={() => dashboard.refetch()} />
      <PsiReviewFilters search={search} onSearch={setSearch} />
      <PsiReviewSummaryCards summary={dashboard.data?.summary} />
      <PsiDashboardCharts dashboard={dashboard.data} />
      <PsiApprovalRegisterTable rows={dashboard.data?.rows ?? []} />
      <div className="grid gap-5 lg:grid-cols-2">
        <RecentPanel title="Recent Approvals" rows={dashboard.data?.recentApprovals ?? []} />
        <RecentPanel title="Recent Returns / Rejections" rows={dashboard.data?.recentReturns ?? []} />
      </div>
    </div>
  );
}

export function PsiApprovalInboxPage({ view = 'inbox', title = 'PSI Approval Inbox' }: { view?: string | undefined; title?: string | undefined }) {
  const [search, setSearch] = useState('');
  const query = usePsiApprovalRequests(view, search ? { search } : {});
  if (query.isLoading) return <PsiLoadingState rows={6} />;
  if (query.isError) return <PsiErrorState message="The PSI approval queue could not be loaded." onRetry={() => query.refetch()} />;
  return (
    <div className="space-y-5">
      <PsiReviewHeader title={title} onRefresh={() => query.refetch()} />
      <PsiReviewFilters search={search} onSearch={setSearch} />
      <PsiApprovalInboxTable rows={query.data?.rows ?? []} />
    </div>
  );
}

export function PsiMySubmissionsPage() {
  return <PsiApprovalInboxPage view="my-submissions" title="My PSI Review Submissions" />;
}

export function PsiApprovalDetailPage({ approvalId, mode = 'detail' }: { approvalId: string; mode?: 'detail' | 'review' | 'snapshot' | undefined }) {
  const detail = usePsiApprovalDetail(approvalId);
  if (detail.isLoading) return <PsiLoadingState rows={7} />;
  if (detail.isError) return <PsiErrorState message="The PSI approval detail could not be loaded." onRetry={() => detail.refetch()} />;
  const data = detail.data;
  if (mode === 'snapshot') return <div className="space-y-5"><PsiApprovalDetailHeader detail={data} onRefresh={() => detail.refetch()} /><PsiApprovalSnapshotPanel snapshots={data?.snapshots} /><PsiApprovalDiffViewer diff={data?.diff} /><PsiApprovalHistoryPanel rows={data?.history} /></div>;
  return (
    <div className="space-y-5">
      <PsiApprovalDetailHeader detail={data} onRefresh={() => detail.refetch()} />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <PsiApprovalPackagePanel detail={data} />
        <PsiApprovalDecisionPanel detail={data} />
      </div>
      <PsiApprovalStageTimeline stages={data?.stages} />
      <PsiApprovalValidationPanel rows={data?.validationResults} />
      <div className="grid gap-5 xl:grid-cols-2">
        <PsiApprovalSnapshotPanel snapshots={data?.snapshots} />
        <PsiApprovalDiffViewer diff={data?.diff} />
      </div>
      <PsiApprovalCommentsPanel comments={data?.comments} detail={data} />
      <PsiApprovalHistoryPanel rows={data?.history} />
      <PsiSubmitReviewDialog />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"><PsiReturnReviewDialog /><PsiRejectReviewDialog /><PsiDelegateReviewDialog /><PsiEscalateReviewDialog /></div>
    </div>
  );
}

export function ScopedPsiApprovalPage({ unitId, equipmentId }: { unitId?: string | undefined; equipmentId?: string | undefined }) {
  const view = '';
  const filters = useMemo(() => ({ ...(unitId ? { unitId } : {}), ...(equipmentId ? { equipmentId } : {}) }), [unitId, equipmentId]);
  const query = usePsiApprovalRequests(view, filters);
  if (query.isLoading) return <PsiLoadingState rows={5} />;
  if (query.isError) return <PsiErrorState message="Scoped PSI approval queue could not be loaded." onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><PsiReviewHeader title={unitId ? 'Unit PSI Review & Approval' : 'Equipment PSI Review & Approval'} onRefresh={() => query.refetch()} /><PsiApprovalRegisterTable rows={query.data?.rows ?? []} /></div>;
}

function RecentPanel({ title, rows }: { title: string; rows: PsiApprovalRequest[] }) {
  return <PsiCard title={title}>{rows.length ? <div className="space-y-2">{rows.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3"><p className="font-semibold">{text(row.psi_record_title)}</p><p className="text-sm text-[var(--psm-muted)]">{text(row.psi_module)} / {text(row.approval_status)}</p></div>)}</div> : <PsiEmptyState title="No records" message="No matching recent approvals or returns were found." />}</PsiCard>;
}

function MiniBars({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (!rows.length) return <PsiEmptyState title="No chart data" message="Backend aggregations returned no records for this chart." />;
  return <div className="space-y-3">{rows.map((row) => <div key={row.label}><div className="mb-1 flex justify-between text-xs"><span>{row.label}</span><span>{row.value}</span></div><PsiProgress value={(row.value / max) * 100} /></div>)}</div>;
}

function Field({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{label}</p><div className="mt-1 text-sm font-semibold text-[var(--psm-fg)]">{typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined ? text(value) : value as any}</div></div>;
}

function DialogStub({ title, text: body }: { title: string; text: string }) {
  return <PsiCard title={title}><p className="text-sm text-[var(--psm-muted)]">{body}</p></PsiCard>;
}
