'use client';

import { AlertTriangle, CheckCircle2, Clock, GitBranch, RotateCcw, Send, ShieldCheck, UserCheck, XCircle } from 'lucide-react';
import { Badge, DetailCard, EmptyState, Field, Metric, MocButton, ProgressBar, detailInput, statusTone } from '../moc-detail-ui';

export function MOCWorkflowSummaryCard({ data }: { data: any }) {
  const summary = data?.summary ?? {};
  return (
    <DetailCard title="Workflow Summary">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Metric label="Workflow Status" value={summary.workflowStatus ?? data?.status ?? 'Not Started'} tone={statusTone(summary.workflowStatus ?? data?.status)} />
        <Metric label="Completed Steps" value={summary.completedStepsCount ?? 0} tone="green" sub={`${summary.pendingStepsCount ?? 0} pending`} />
        <Metric label="Rejected / Returned" value={summary.rejectedStepsCount ?? 0} tone={(summary.rejectedStepsCount ?? 0) ? 'red' : 'slate'} />
        <Metric label="SLA" value={summary.overdue ? 'Overdue' : 'On Track'} tone={summary.overdue ? 'red' : 'green'} sub={summary.slaDueDate ? new Date(summary.slaDueDate).toLocaleString() : 'No active due date'} />
      </div>
      <div className="mt-4 grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 sm:grid-cols-2 md:grid-cols-3">
        <Info label="Template" value={summary.workflowTemplateName ?? data?.templateName} />
        <Info label="Current Step" value={summary.currentStep ?? data?.currentStep} />
        <Info label="Current Approver / Group" value={summary.currentApprover ?? data?.currentApprover ?? '-'} />
        <Info label="Last Action By" value={summary.lastActionBy ?? '-'} />
        <Info label="Last Action At" value={summary.lastActionAt ? new Date(summary.lastActionAt).toLocaleString() : '-'} />
        <Info label="Approval Blockers" value={summary.blockersCount ?? data?.blockers?.length ?? 0} />
      </div>
    </DetailCard>
  );
}

export function MOCApprovalStepper({ steps }: { steps: any[] }) {
  return (
    <DetailCard title="Approval Stepper">
      {steps?.length ? (
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-[760px] gap-3">
            {steps.map((step, index) => {
              const active = step.status === 'In Progress' || step.status === 'Active';
              const complete = step.status === 'Approved' || step.status === 'Skipped by Rule';
              return (
                <div
                  key={step.id ?? index}
                  className={`relative min-w-48 rounded-xl border p-4 transition-all ${
                    active
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : complete
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : step.status === 'Rejected'
                      ? 'border-red-500/30 bg-red-500/10'
                      : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[var(--psm-muted)]">STEP {index + 1}</span>
                    {complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : active ? (
                      <Clock className="h-4 w-4 text-primary" />
                    ) : (
                      <GitBranch className="h-4 w-4 text-[var(--psm-muted)]" />
                    )}
                  </div>
                  <p className="mt-2 font-black text-[var(--psm-fg)]">{step.stepName}</p>
                  <p className="mt-1 text-xs text-[var(--psm-muted)]">{step.stepType ?? 'Approval'} · {step.requiredRoleUser ?? 'Workflow assignment'}</p>
                  <div className="mt-3"><Badge tone={statusTone(step.status)}>{step.status}</Badge></div>
                  <p className="mt-2 text-xs text-[var(--psm-muted)]">{step.dueDate ? `Due ${new Date(step.dueDate).toLocaleString()}` : 'No due date'}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState title="Approval workflow has not started." detail="Start workflow to load the real approval path from the Workflow Engine." />
      )}
    </DetailCard>
  );
}

export function CurrentApprovalStepPanel({ data }: { data: any }) {
  const step = data?.steps?.find((item: any) => item.status === 'In Progress' || item.status === 'Active');
  const blockers = data?.blockers ?? [];
  return (
    <DetailCard title="Current Approval Step Panel">
      {step ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Required Action</p>
            <h3 className="mt-1 text-lg font-black text-[var(--psm-fg)]">{step.stepName}</h3>
            <p className="mt-1 text-sm text-[var(--psm-fg)]">Assigned to {step.assignedUserGroup ?? 'configured workflow role/group'}.</p>
            <p className="mt-2 text-xs text-[var(--psm-muted)]">{step.dueDate ? `SLA due ${new Date(step.dueDate).toLocaleString()}` : 'No SLA due date set'}</p>
          </div>
          <Blockers blockers={blockers} />
        </div>
      ) : (
        <EmptyState title="No active approval step." detail="The workflow is pending start, complete, rejected, returned, or cancelled." />
      )}
    </DetailCard>
  );
}

export function ApproversTable({ approvers }: { approvers: any[] }) {
  return (
    <DetailCard title="Approvers Table">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              {['#', 'Role', 'Assigned Approver', 'Delegated', 'Status', 'Due', 'Completed', 'Decision', 'Comment'].map((h) => (
                <th key={h} className="px-3 py-2.5 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {approvers?.map((row) => (
              <tr key={row.id} className="text-[var(--psm-fg)] transition-colors hover:bg-[var(--psm-surface-2)]">
                <td className="px-3 py-3 font-semibold">{row.stepOrder}</td>
                <td className="px-3 py-3 text-[var(--psm-muted)]">{row.role ?? '-'}</td>
                <td className="px-3 py-3 font-medium">{row.assignedApprover ?? row.assignedUserGroup ?? '-'}</td>
                <td className="px-3 py-3 text-[var(--psm-muted)]">{row.delegatedApprover ?? '-'}</td>
                <td className="px-3 py-3"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                <td className="px-3 py-3 text-[var(--psm-muted)]">{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-'}</td>
                <td className="px-3 py-3 text-[var(--psm-muted)]">{row.completedAt ? new Date(row.completedAt).toLocaleDateString() : '-'}</td>
                <td className="px-3 py-3">{row.decision ?? row.status}</td>
                <td className="px-3 py-3 text-[var(--psm-muted)]">{row.comment ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!approvers?.length ? <EmptyState title="No approver rows yet." /> : null}
    </DetailCard>
  );
}

export function ApprovalComments({ comments }: { comments: any[] }) {
  return (
    <DetailCard title="Approval Comments">
      {comments?.length ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[var(--psm-fg)]">{comment.author_id ?? comment.user ?? 'Workflow user'}</p>
                <span className="text-xs text-[var(--psm-muted)]">{comment.created_at ? new Date(comment.created_at).toLocaleString() : '-'}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--psm-fg)]">{comment.body ?? comment.comment}</p>
              <p className="mt-2 text-xs text-[var(--psm-muted)]">Step: {comment.workflow_step_id ?? comment.step ?? 'General'} · Visibility: {comment.visibility ?? 'Workflow'}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No approval comments yet." detail="Rejection and return comments will appear here." />
      )}
    </DetailCard>
  );
}

export function WorkflowHistory({ history }: { history: any[] }) {
  return (
    <DetailCard title="Workflow History">
      {history?.length ? (
        <div className="space-y-3">
          {history.map((event) => (
            <div key={event.id} className="flex gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
              <div>
                <p className="font-bold text-[var(--psm-fg)]">{event.event_type ?? event.type}</p>
                <p className="text-sm text-[var(--psm-fg)]">{event.description ?? event.title}</p>
                <p className="mt-1 text-xs text-[var(--psm-muted)]">{event.created_at ? new Date(event.created_at).toLocaleString() : '-'} · {event.user_id ?? event.actor_id ?? 'System'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No workflow history yet." />
      )}
    </DetailCard>
  );
}

export function WorkflowEscalationPanel({ data }: { data: any }) {
  const active = data?.steps?.find((item: any) => item.status === 'In Progress' || item.status === 'Active');
  const due = active?.dueDate ? new Date(active.dueDate) : null;
  const overdue = due ? due.getTime() < Date.now() : false;
  return (
    <DetailCard title="Escalation / SLA Panel">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Info label="Current SLA Due" value={due ? due.toLocaleString() : '-'} />
        <Info label="Time Remaining" value={due ? `${Math.ceil((due.getTime() - Date.now()) / 3600000)} hours` : '-'} />
        <Info label="Overdue Duration" value={overdue && due ? `${Math.abs(Math.ceil((due.getTime() - Date.now()) / 3600000))} hours` : '-'} />
        <Info label="Escalation Level" value={overdue ? 'Department head / HSE / Plant Manager' : 'None'} />
      </div>
      <div className="mt-4"><ProgressBar value={overdue ? 100 : 55} tone={overdue ? 'red' : 'green'} /></div>
    </DetailCard>
  );
}

export function WorkflowActionBar({ mutations, disabled }: { mutations: any; disabled?: boolean }) {
  return (
    <DetailCard title="Workflow Actions">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MocButton
          variant="primary"
          disabled={disabled || mutations.start.isPending}
          onClick={() => mutations.start.mutate()}
          icon={<Send className="h-4 w-4" />}
        >
          Start Workflow
        </MocButton>
        <MocButton
          variant="outline"
          disabled={disabled || mutations.approve.isPending}
          onClick={() => mutations.approve.mutate({ comment: 'Approved from MOC approval workflow tab' })}
          icon={<ShieldCheck className="h-4 w-4" />}
        >
          Approve Step
        </MocButton>
        <MocButton
          variant="danger"
          disabled={disabled || mutations.reject.isPending}
          onClick={() => mutations.reject.mutate({ reason: 'Rejected from MOC approval workflow tab' })}
          icon={<XCircle className="h-4 w-4" />}
        >
          Reject
        </MocButton>
        <MocButton
          variant="outline"
          disabled={disabled || mutations.returnForRevision.isPending}
          onClick={() => mutations.returnForRevision.mutate({ reason: 'Returned for revision from approval workflow tab' })}
          icon={<RotateCcw className="h-4 w-4" />}
        >
          Return Revision
        </MocButton>
        <div className="sm:col-span-2">
          <Field label="Delegate To User ID">
            <input className={detailInput} placeholder="Enter user ID..." id="moc-workflow-delegate-user" />
          </Field>
        </div>
        <MocButton
          variant="outline"
          disabled={disabled || mutations.delegate.isPending}
          onClick={() => mutations.delegate.mutate({ delegateToUserId: (document.getElementById('moc-workflow-delegate-user') as HTMLInputElement)?.value, reason: 'Delegated from MOC workflow tab' })}
          icon={<UserCheck className="h-4 w-4" />}
        >
          Delegate
        </MocButton>
        <MocButton
          variant="outline"
          disabled={disabled || mutations.escalate.isPending}
          onClick={() => mutations.escalate.mutate()}
          icon={<AlertTriangle className="h-4 w-4" />}
        >
          Escalate
        </MocButton>
        <MocButton
          variant="outline"
          disabled={disabled || mutations.restart.isPending}
          onClick={() => mutations.restart.mutate({ reason: 'Workflow restarted after MOC context change' })}
          icon={<RotateCcw className="h-4 w-4" />}
        >
          Restart Workflow
        </MocButton>
      </div>
    </DetailCard>
  );
}

function Blockers({ blockers }: { blockers: any[] }) {
  return (
    <div className="space-y-2">
      {blockers?.length ? (
        blockers.map((blocker) => (
          <div key={blocker.id ?? blocker.blockerTitle} className="rounded-xl border border-red-500/25 bg-red-500/10 p-4">
            <p className="font-bold text-red-700 dark:text-red-200">{blocker.blockerTitle}</p>
            <p className="text-xs text-red-600 dark:text-red-300">{blocker.blockerType} · {blocker.severity}</p>
          </div>
        ))
      ) : (
        <EmptyState title="No approval blockers." />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">{label}</p>
      <p className="mt-1 font-bold text-[var(--psm-fg)]">{value ?? '-'}</p>
    </div>
  );
}

const button = 'inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-xs font-bold text-[var(--psm-fg)] hover:bg-[var(--psm-surface)] disabled:cursor-not-allowed disabled:opacity-50';
const primary = 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white shadow hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';
const danger = 'inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50';

export { button as workflowButton, primary as workflowPrimary, danger as workflowDanger };
