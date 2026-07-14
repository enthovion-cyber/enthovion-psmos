import { ApprovalStatusBadge } from '../shared/ApprovalStatusBadge';
import { ClosureStatusBadge } from '../shared/ClosureStatusBadge';
import { ESignatureStatusBadge } from '../shared/ESignatureStatusBadge';
import { Badge } from '../shared/IncidentStatusBadge';
import { buttonPrimary, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';
import { WorkflowStatusBadge } from '../shared/WorkflowStatusBadge';

export function ReviewApprovalHeader({ data, saving, message, onRunReadiness, onStartWorkflow, onAddReviewer, onRequestClosure, onClose, onReopen, onRefresh }: any) {
  const header = data?.header ?? {};
  const actions = header.actions ?? [];
  const enabled = (key: string) => actions.find((action: any) => action.key === key)?.enabled ?? false;
  const disabledReason = (key: string) => actions.find((action: any) => action.key === key)?.disabledReason ?? 'Action is not available.';
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black">Review & Approval</h2>
            <ApprovalStatusBadge value={header.approvalStatus ?? header.reviewStatus} />
            <WorkflowStatusBadge value={header.workflowStatus ?? header.approvalWorkflowStatus} />
            <ESignatureStatusBadge value={header.signatureStatus ?? (header.pendingApprovalsCount ? 'Signature required' : 'Not required')} required />
            <ClosureStatusBadge value={header.closureStatus ?? (header.readyForClosure ? 'Ready for Closure' : 'Not Ready')} />
            {header.readOnly ? <Badge value="Read-only" map={{ 'Read-only': 'slate' }} /> : null}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{header.incidentNumber} · {header.title}</p>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <HeaderFact label="Review status" value={header.reviewStatus} />
            <HeaderFact label="Current step" value={header.currentWorkflowStep ?? header.approvalWorkflowStatus} />
            <HeaderFact label="Readiness" value={header.readinessStatus ?? data?.readiness?.status} />
            <HeaderFact label="Required reviewers" value={header.requiredReviewers ?? header.requiredApprovalsCount} />
            <HeaderFact label="Pending reviewers" value={header.pendingReviewers ?? header.pendingApprovalsCount} />
            <HeaderFact label="Blocking items" value={header.blockingItems ?? header.openBlockersCount} />
            <HeaderFact label="Last checked" value={formatDate(header.lastReadinessCheckAt ?? header.lastUpdated)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          <button className={buttonSecondary} disabled={saving} onClick={onRunReadiness}>Run Readiness</button>
          <button title={disabledReason('start-workflow')} className={buttonPrimary} disabled={saving || !enabled('start-workflow')} onClick={onStartWorkflow}>Start Workflow</button>
          <button title={disabledReason('add-reviewer')} className={buttonSecondary} disabled={saving || !enabled('add-reviewer')} onClick={onAddReviewer}>Add Reviewer</button>
          <button title={disabledReason('request-closure')} className={buttonSecondary} disabled={saving || !enabled('request-closure')} onClick={onRequestClosure}>Request Closure</button>
          <button title={disabledReason('close')} className={buttonPrimary} disabled={saving || !enabled('close')} onClick={onClose}>Close Incident</button>
          <button title={disabledReason('reopen')} className={buttonSecondary} disabled={saving || !enabled('reopen')} onClick={onReopen}>Reopen</button>
          <button className={buttonSecondary} disabled={saving} onClick={onRefresh}>Refresh</button>
        </div>
      </div>
      {message ? <div className="mt-3 rounded-lg border border-blue-400/25 bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-200">{message}</div> : null}
    </section>
  );
}

function HeaderFact({ label, value }: { label: string; value: any }) {
  return <div><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div><div className="font-semibold">{value ?? '-'}</div></div>;
}
