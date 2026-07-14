'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, GitBranch, RotateCcw, ShieldAlert, XCircle } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import type { WorkflowInstanceStep } from '@/services/workflows.service';
import { useWorkflowInstance, useWorkflowMutations } from '../hooks/useWorkflows';
import { StepStatusBadge, WorkflowStatusBadge } from './WorkflowBadges';

export function WorkflowInstanceDetail({ id }: { id: string }) {
  const workflowQuery = useWorkflowInstance(id);
  const mutations = useWorkflowMutations(id);
  const toast = useMutationToast();
  const [comment, setComment] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const workflow = workflowQuery.data;
  const activeSteps = useMemo(() => workflow?.steps.filter((step) => step.status === 'Active') ?? [], [workflow]);

  async function run(work: () => Promise<unknown>, message: string) {
    try {
      await work();
      toast.success(message);
      setComment('');
    } catch (error) {
      toast.error('Workflow action failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  if (workflowQuery.isLoading) return <div className="psm-card p-5">Loading workflow...</div>;
  if (!workflow) return <div className="psm-card p-5 text-danger">Workflow not found.</div>;

  const completed = workflow.steps.filter((step) => ['Approved', 'Skipped', 'Overridden'].includes(step.status)).length;
  const progress = workflow.steps.length ? Math.round((completed / workflow.steps.length) * 100) : 0;
  const activeStepId = activeSteps[0]?.id;
  const decisionPayload = activeStepId ? { stepId: activeStepId, comment } : { comment };

  return (
    <div className="space-y-5">
      <section className="psm-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2"><WorkflowStatusBadge status={workflow.status} /><span className="psm-badge psm-badge-info">{workflow.module}</span></div>
            <h1 className="text-2xl font-semibold">{workflow.record_number}</h1>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">Reusable workflow instance for {workflow.module} record {workflow.record_id}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
            <Metric label="Progress" value={`${progress}%`} />
            <Metric label="Active Steps" value={String(activeSteps.length)} />
            <Metric label="Escalations" value={String(workflow.escalations.length)} danger={workflow.escalations.length > 0} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-5">
          <Card title="Approval Chain">
            <div className="space-y-3">
              {workflow.steps.map((step) => <ApprovalStep key={step.id} step={step} />)}
            </div>
          </Card>

          <Card title="Workflow History">
            <div className="space-y-3">
              {workflow.history.map((item) => (
                <div key={item.id} className="border-l-2 border-primary pl-3 text-sm">
                  <div className="font-semibold">{item.event_type.replaceAll('_', ' ')}</div>
                  <div className="text-xs text-[var(--psm-muted)]">{item.description} · {new Date(item.created_at).toLocaleString()}</div>
                </div>
              ))}
              {!workflow.history.length ? <Empty text="No workflow history yet." /> : null}
            </div>
          </Card>

          <Card title="Comments">
            <div className="space-y-3">
              {workflow.comments.map((item) => (
                <div key={item.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">
                  <div className="flex justify-between gap-3"><strong>{item.author_id ?? 'User'}</strong><span className="text-xs text-[var(--psm-muted)]">{new Date(item.created_at).toLocaleString()}</span></div>
                  <p className="mt-2 text-[var(--psm-muted)]">{item.body}</p>
                </div>
              ))}
              {!workflow.comments.length ? <Empty text="No comments have been added." /> : null}
            </div>
          </Card>
        </section>

        <aside className="space-y-5">
          <Card title="Current Active Step">
            {activeSteps.length ? activeSteps.map((step) => (
              <div key={step.id} className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-4">
                <div className="flex items-center justify-between gap-3"><strong>{step.step_name}</strong><StepStatusBadge status={step.status} /></div>
                <div className="mt-2 text-xs text-[var(--psm-muted)]">Mode {step.approval_mode} · Due {step.due_at ? new Date(step.due_at).toLocaleString() : 'No SLA'}</div>
              </div>
            )) : <Empty text="No active step." />}
            <textarea className="psm-input min-h-24 w-full p-3 text-sm" placeholder="Decision comment..." value={comment} onChange={(event) => setComment(event.target.value)} />
            <div className="mt-3 grid gap-2">
              <button className="psm-button psm-button-primary" disabled={!activeSteps.length} onClick={() => run(() => mutations.approve.mutateAsync(decisionPayload), 'Step approved')}><CheckCircle2 size={16} /> Approve Step</button>
              <button className="psm-button psm-button-secondary" disabled={!activeSteps.length || !comment.trim()} onClick={() => run(() => mutations.returnForRevision.mutateAsync(decisionPayload), 'Returned for revision')}><RotateCcw size={16} /> Return for Revision</button>
              <button className="psm-button psm-button-danger" disabled={!activeSteps.length || !comment.trim()} onClick={() => run(() => mutations.reject.mutateAsync(decisionPayload), 'Workflow rejected')}><XCircle size={16} /> Reject</button>
            </div>
          </Card>

          <Card title="SLA & Escalations">
            <div className="space-y-3">
              {workflow.escalations.map((item) => (
                <div key={item.id} className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
                  <div className="font-semibold text-warning">Level {item.escalation_level}</div>
                  <div className="mt-1 text-[var(--psm-muted)]">{item.reason}</div>
                  <div className="mt-1 text-xs text-[var(--psm-muted)]">{new Date(item.escalated_at).toLocaleString()}</div>
                </div>
              ))}
              {!workflow.escalations.length ? <Empty text="No escalations recorded." /> : null}
              <button className="psm-button psm-button-secondary w-full" onClick={() => run(() => mutations.escalate.mutateAsync(), 'Overdue steps escalated')}><Clock size={16} /> Run Escalation</button>
            </div>
          </Card>

          <Card title="Emergency Override">
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger"><ShieldAlert size={16} className="mt-0.5 shrink-0" /> Override closes all remaining approval steps and writes audit history.</div>
            <textarea className="psm-input min-h-20 w-full p-3 text-sm" placeholder="Required override reason" value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} />
            <button className="psm-button psm-button-danger mt-3 w-full" disabled={overrideReason.trim().length < 5} onClick={() => run(() => mutations.override.mutateAsync(overrideReason), 'Workflow overridden')}><AlertTriangle size={16} /> Emergency Override</button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ApprovalStep({ step }: { step: WorkflowInstanceStep }) {
  const overdue = step.status === 'Active' && step.due_at && new Date(step.due_at).getTime() < Date.now();
  return (
    <div className={`rounded-xl border p-4 ${step.status === 'Active' ? 'border-primary/40 bg-primary/10' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]'}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--psm-surface-3)] text-xs font-bold">{step.sequence}</span><strong>{step.step_name}</strong></div>
          <div className="mt-2 text-xs text-[var(--psm-muted)]">{step.step_type} · {step.approval_mode} · {step.parallel_group ? `Parallel: ${step.parallel_group}` : 'Sequential'}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2"><StepStatusBadge status={step.status} />{overdue ? <span className="psm-badge psm-badge-danger">Overdue</span> : null}</div>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-[var(--psm-muted)] md:grid-cols-3">
        <span>Role: {step.assigned_to_role_id ?? '-'}</span>
        <span>User: {step.assigned_to_user_id ?? '-'}</span>
        <span>Due: {step.due_at ? new Date(step.due_at).toLocaleString() : '-'}</span>
      </div>
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">{label}</div><div className={`mt-2 text-2xl font-semibold ${danger ? 'text-danger' : ''}`}>{value}</div></div>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="psm-card p-5"><h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">{title}</h2>{children}</section>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-sm text-[var(--psm-muted)]">{text}</div>;
}
