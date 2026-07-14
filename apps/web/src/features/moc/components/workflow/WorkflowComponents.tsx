'use client';

import { AlertTriangle, CheckCircle2, Clock, GitBranch, RotateCcw, Send, ShieldCheck, UserCheck, XCircle } from 'lucide-react';
import { Badge, DetailCard, EmptyState, Field, Metric, ProgressBar, detailInput, detailTextarea, statusTone } from '../moc-detail-ui';

const button = 'inline-flex items-center justify-center gap-2 rounded-md border border-cyan-300/15 px-3 py-2 text-xs font-black text-slate-100 hover:border-blue-300/50 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50';
const primary = 'inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50';
const danger = 'inline-flex items-center justify-center gap-2 rounded-md border border-red-300/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-100 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50';

export function MOCWorkflowSummaryCard({ data }: { data: any }) {
  const summary = data?.summary ?? {};
  return (
    <DetailCard title="Workflow Summary">
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Workflow Status" value={summary.workflowStatus ?? data?.status ?? 'Not Started'} tone={statusTone(summary.workflowStatus ?? data?.status)} />
        <Metric label="Completed Steps" value={summary.completedStepsCount ?? 0} tone="green" sub={`${summary.pendingStepsCount ?? 0} pending`} />
        <Metric label="Rejected / Returned" value={summary.rejectedStepsCount ?? 0} tone={(summary.rejectedStepsCount ?? 0) ? 'red' : 'slate'} />
        <Metric label="SLA" value={summary.overdue ? 'Overdue' : 'On Track'} tone={summary.overdue ? 'red' : 'green'} sub={summary.slaDueDate ? new Date(summary.slaDueDate).toLocaleString() : 'No active due date'} />
      </div>
      <div className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 md:grid-cols-3">
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
                <div key={step.id ?? index} className={`relative min-w-44 rounded-xl border p-3 ${active ? 'border-blue-300/45 bg-blue-500/10' : complete ? 'border-emerald-300/30 bg-emerald-500/10' : step.status === 'Rejected' ? 'border-red-300/30 bg-red-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400">STEP {index + 1}</span>
                    {complete ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : active ? <Clock className="h-4 w-4 text-blue-300" /> : <GitBranch className="h-4 w-4 text-slate-500" />}
                  </div>
                  <p className="mt-2 font-black text-white">{step.stepName}</p>
                  <p className="mt-1 text-xs text-slate-400">{step.stepType ?? 'Approval'} · {step.requiredRoleUser ?? 'Workflow assignment'}</p>
                  <div className="mt-3"><Badge tone={statusTone(step.status)}>{step.status}</Badge></div>
                  <p className="mt-2 text-xs text-slate-500">{step.dueDate ? `Due ${new Date(step.dueDate).toLocaleString()}` : 'No due date'}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : <EmptyState title="Approval workflow has not started." detail="Start workflow to load the real approval path from the Workflow Engine." />}
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
          <div className="rounded-lg border border-blue-300/20 bg-blue-500/10 p-4">
            <p className="text-xs uppercase text-blue-200">Required Action</p>
            <h3 className="mt-1 text-lg font-black text-white">{step.stepName}</h3>
            <p className="mt-1 text-sm text-slate-300">Assigned to {step.assignedUserGroup ?? 'configured workflow role/group'}.</p>
            <p className="mt-2 text-xs text-slate-400">{step.dueDate ? `SLA due ${new Date(step.dueDate).toLocaleString()}` : 'No SLA due date set'}</p>
          </div>
          <Blockers blockers={blockers} />
        </div>
      ) : <EmptyState title="No active approval step." detail="The workflow is pending start, complete, rejected, returned, or cancelled." />}
    </DetailCard>
  );
}

export function ApproversTable({ approvers }: { approvers: any[] }) {
  return (
    <DetailCard title="Approvers Table">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr>{['#', 'Role', 'Assigned Approver', 'Delegated', 'Status', 'Due', 'Completed', 'Decision', 'Comment'].map((h) => <th key={h} className="border-b border-white/10 px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>{approvers?.map((row) => <tr key={row.id} className="border-b border-white/5 text-slate-300"><td className="px-3 py-3">{row.stepOrder}</td><td className="px-3 py-3">{row.role ?? '-'}</td><td className="px-3 py-3">{row.assignedApprover ?? row.assignedUserGroup ?? '-'}</td><td className="px-3 py-3">{row.delegatedApprover ?? '-'}</td><td className="px-3 py-3"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td><td className="px-3 py-3">{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-'}</td><td className="px-3 py-3">{row.completedAt ? new Date(row.completedAt).toLocaleDateString() : '-'}</td><td className="px-3 py-3">{row.decision ?? row.status}</td><td className="px-3 py-3">{row.comment ?? '-'}</td></tr>)}</tbody>
        </table>
      </div>
      {!approvers?.length ? <EmptyState title="No approver rows yet." /> : null}
    </DetailCard>
  );
}

export function ApprovalComments({ comments }: { comments: any[] }) {
  return (
    <DetailCard title="Approval Comments">
      {comments?.length ? <div className="space-y-3">{comments.map((comment) => <div key={comment.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><div className="flex items-center justify-between"><p className="font-bold text-white">{comment.author_id ?? comment.user ?? 'Workflow user'}</p><span className="text-xs text-slate-500">{comment.created_at ? new Date(comment.created_at).toLocaleString() : '-'}</span></div><p className="mt-2 text-sm text-slate-300">{comment.body ?? comment.comment}</p><p className="mt-2 text-xs text-slate-500">Step: {comment.workflow_step_id ?? comment.step ?? 'General'} · Visibility: {comment.visibility ?? 'Workflow'}</p></div>)}</div> : <EmptyState title="No approval comments yet." detail="Rejection and return comments will appear here." />}
    </DetailCard>
  );
}

export function WorkflowHistory({ history }: { history: any[] }) {
  return (
    <DetailCard title="Workflow History">
      {history?.length ? <div className="space-y-3">{history.map((event) => <div key={event.id} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"><div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-300" /><div><p className="font-bold text-white">{event.event_type ?? event.type}</p><p className="text-sm text-slate-300">{event.description ?? event.title}</p><p className="mt-1 text-xs text-slate-500">{event.created_at ? new Date(event.created_at).toLocaleString() : '-'} · {event.user_id ?? event.actor_id ?? 'System'}</p></div></div>)}</div> : <EmptyState title="No workflow history yet." />}
    </DetailCard>
  );
}

export function WorkflowEscalationPanel({ data }: { data: any }) {
  const active = data?.steps?.find((item: any) => item.status === 'In Progress' || item.status === 'Active');
  const due = active?.dueDate ? new Date(active.dueDate) : null;
  const overdue = due ? due.getTime() < Date.now() : false;
  return (
    <DetailCard title="Escalation / SLA Panel">
      <div className="grid gap-3 md:grid-cols-2">
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
      <div className="grid gap-2 md:grid-cols-2">
        <button className={primary} disabled={disabled || mutations.start.isPending} onClick={() => mutations.start.mutate()}><Send className="h-4 w-4" /> Start Workflow</button>
        <button className={button} disabled={disabled || mutations.approve.isPending} onClick={() => mutations.approve.mutate({ comment: 'Approved from MOC approval workflow tab' })}><ShieldCheck className="h-4 w-4" /> Approve Current Step</button>
        <button className={danger} disabled={disabled || mutations.reject.isPending} onClick={() => mutations.reject.mutate({ reason: 'Rejected from MOC approval workflow tab' })}><XCircle className="h-4 w-4" /> Reject</button>
        <button className={button} disabled={disabled || mutations.returnForRevision.isPending} onClick={() => mutations.returnForRevision.mutate({ reason: 'Returned for revision from approval workflow tab' })}><RotateCcw className="h-4 w-4" /> Return For Revision</button>
        <Field label="Delegate To User ID"><input className={detailInput} placeholder="User ID" onBlur={(event) => event.currentTarget.dataset.value = event.currentTarget.value} id="moc-workflow-delegate-user" /></Field>
        <button className={button} disabled={disabled || mutations.delegate.isPending} onClick={() => mutations.delegate.mutate({ delegateToUserId: (document.getElementById('moc-workflow-delegate-user') as HTMLInputElement)?.value, reason: 'Delegated from MOC workflow tab' })}><UserCheck className="h-4 w-4" /> Delegate Approval</button>
        <button className={button} disabled={disabled || mutations.escalate.isPending} onClick={() => mutations.escalate.mutate()}><AlertTriangle className="h-4 w-4" /> Escalate</button>
        <button className={button} disabled={disabled || mutations.restart.isPending} onClick={() => mutations.restart.mutate({ reason: 'Workflow restarted after MOC context change' })}><RotateCcw className="h-4 w-4" /> Restart Workflow</button>
      </div>
    </DetailCard>
  );
}

function Blockers({ blockers }: { blockers: any[] }) {
  return <div className="space-y-2">{blockers?.length ? blockers.map((blocker) => <div key={blocker.id ?? blocker.blockerTitle} className="rounded-lg border border-red-300/20 bg-red-500/10 p-3"><p className="font-bold text-red-100">{blocker.blockerTitle}</p><p className="text-xs text-red-200/75">{blocker.blockerType} · {blocker.severity}</p></div>) : <EmptyState title="No approval blockers." />}</div>;
}

function Info({ label, value }: { label: string; value: any }) {
  return <div><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-100">{value ?? '-'}</p></div>;
}

export { button as workflowButton, primary as workflowPrimary, danger as workflowDanger };
