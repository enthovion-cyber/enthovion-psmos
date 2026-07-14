'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { useHazopReviewComments } from '../../hooks/useHazopReviewComments';
import { useHazopReviewReadiness } from '../../hooks/useHazopReviewReadiness';
import { useHazopReviewWorkflow } from '../../hooks/useHazopReviewWorkflow';
import { useHazopSignoffMutations } from '../../hooks/useHazopSignoffMutations';
import { useHazopSignoffs } from '../../hooks/useHazopSignoffs';
import type { HazopReviewComment } from '../../types/hazop-review.types';
import type { HazopSignoff } from '../../types/hazop-signoff.types';
import { HazopApprovalTimeline } from '../review/HazopApprovalTimeline';
import { HazopApprovalWorkflowPanel } from '../review/HazopApprovalWorkflowPanel';
import { HazopClosureBlockersPanel } from '../review/HazopClosureBlockersPanel';
import { HazopElectronicSignaturePanel } from '../review/HazopElectronicSignaturePanel';
import { HazopExportApprovalPackagePanel } from '../review/HazopExportApprovalPackagePanel';
import { HazopFinalApprovalPanel } from '../review/HazopFinalApprovalPanel';
import { HazopReadinessChecklist } from '../review/HazopReadinessChecklist';
import { HazopRequiredSignoffMatrix } from '../review/HazopRequiredSignoffMatrix';
import { HazopReviewCommentsPanel } from '../review/HazopReviewCommentsPanel';
import { HazopReviewReadinessSummaryCards } from '../review/HazopReviewReadinessSummaryCards';

type DialogState =
  | { type: 'sign'; signoff: HazopSignoff }
  | { type: 'rejectSignoff'; signoff: HazopSignoff }
  | { type: 'resolveComment'; comment: HazopReviewComment }
  | { type: 'workflow'; action: 'reject' | 'return' | 'close' | 'reopen'; title: string; label: string }
  | null;

type ToastState = { tone: 'success' | 'error' | 'info'; message: string } | null;

export function HazopReviewSignoffTab({ study }: { study: any }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const permissions = useMyPermissions().data ?? [];
  const me = currentUserFromToken();
  const can = (permission: string) => permissions.includes(permission) || permissions.includes(permission.replace(/\./g, ':')) || permissions.includes('hazop:manage');
  const review = useHazopReviewReadiness(study.id);
  const signoffsQuery = useHazopSignoffs(study.id);
  const workflowMutations = useHazopReviewWorkflow(study.id);
  const signoffMutations = useHazopSignoffMutations(study.id);
  const commentMutations = useHazopReviewComments(study.id);
  const readiness = review.readiness.data;
  const signoffs = signoffsQuery.data ?? [];
  const blockers = review.blockers.data ?? readiness?.blockers ?? [];
  const comments = review.comments.data ?? [];
  const workflow = review.workflow.data;
  const readOnly = ['Closed'].includes(study.status ?? workflow?.status ?? '');
  const commentBusy = commentMutations.add.isPending || commentMutations.resolve.isPending || commentMutations.createAction.isPending;

  if (!can('hazop.review.view') && !can('hazop.signoff.view')) return <StateCard tone="red" title="Permission denied" text="You do not have permission to view HAZOP review and sign-off." />;

  const run = async (label: string, action: () => Promise<unknown>) => {
    try {
      await action();
      setToast({ tone: 'success', message: label });
      setDialog(null);
    } catch (error) {
      setToast({ tone: 'error', message: errorMessage(error) });
    }
  };

  const exportPackage = async () => {
    try {
      const file = await workflowMutations.exportPackage.mutateAsync();
      const blob = new Blob([file.content], { type: file.contentType ?? 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = file.fileName ?? `${study.study_number}-review-package.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      setToast({ tone: 'success', message: 'Approval package exported.' });
    } catch (error) {
      setToast({ tone: 'error', message: errorMessage(error) });
    }
  };

  const resolveComment = (comment: HazopReviewComment) => setDialog({ type: 'resolveComment', comment });
  const createCommentAction = (comment: HazopReviewComment) => void run('Review comment action created.', () => commentMutations.createAction.mutateAsync({ commentId: comment.id, values: { title: 'Resolve HAZOP review comment', priority: comment.severity === 'Critical' ? 'High' : 'Medium' } }));

  return (
    <div className="space-y-5">
      {toast ? <Toast toast={toast} onClose={() => setToast(null)} /> : null}
      {review.readiness.isError ? <StateCard tone="red" title="Unable to load readiness" text="Check HAZOP review/sign-off migrations and API permissions." /> : null}
      {signoffsQuery.isError ? <StateCard tone="red" title="Unable to load sign-off matrix" text="The sign-off API returned an error. Regenerate the matrix after schema checks are applied." /> : null}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Review & Sign-Off</h2>
          <p className="text-sm text-[var(--psm-muted)]">Backend readiness, closure blockers, workflow approval, e-signature status, review comments, and final closure.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can('hazop.review.start') ? <button disabled={workflowMutations.recalculate.isPending} onClick={() => void run('Readiness recalculated.', () => workflowMutations.recalculate.mutateAsync())} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold disabled:opacity-45">{workflowMutations.recalculate.isPending ? 'Recalculating...' : 'Recalculate Readiness'}</button> : null}
          {can('hazop.review.export_package') ? <button disabled={workflowMutations.exportPackage.isPending} onClick={() => void exportPackage()} className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-100 disabled:opacity-45">Export Approval Package</button> : null}
        </div>
      </div>

      <HazopReviewReadinessSummaryCards readiness={readiness} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <HazopApprovalWorkflowPanel
            workflow={workflow}
            signoffs={signoffs}
            readOnly={readOnly}
            loadingAction={{
              start: workflowMutations.start.isPending,
              requestApproval: workflowMutations.requestApproval.isPending,
              approve: workflowMutations.approve.isPending,
              reject: workflowMutations.reject.isPending,
              return: workflowMutations.returnForRework.isPending
            }}
            canStart={can('hazop.review.start')}
            canRequestApproval={can('hazop.review.request_approval')}
            canApprove={can('hazop.review.approve')}
            canReject={can('hazop.review.reject')}
            canReturn={can('hazop.review.return_for_rework')}
            onStart={() => void run('Review started.', () => workflowMutations.start.mutateAsync({ comment: 'Review started from Review & Sign-Off tab' }))}
            onRequestApproval={() => void run('Approval requested.', () => workflowMutations.requestApproval.mutateAsync({ comment: 'Approval requested from Review & Sign-Off tab' }))}
            onApprove={() => void run('Study approved.', () => workflowMutations.approve.mutateAsync({ comment: 'Approved from Review & Sign-Off tab' }))}
            onReject={() => setDialog({ type: 'workflow', action: 'reject', title: 'Reject HAZOP Review', label: 'Rejection reason' })}
            onReturn={() => setDialog({ type: 'workflow', action: 'return', title: 'Return for Rework', label: 'Required rework reason' })}
          />
          <HazopRequiredSignoffMatrix
            signoffs={signoffs}
            readOnly={readOnly}
            loadingAction={{
              generate: signoffMutations.generate.isPending,
              request: signoffMutations.request.isPending,
              sign: signoffMutations.sign.isPending,
              reject: signoffMutations.reject.isPending
            }}
            canGenerate={can('hazop.signoff.generate') || can('hazop.signoff.request')}
            canRequest={can('hazop.signoff.request')}
            canSign={can('hazop.signoff.sign')}
            canReject={can('hazop.signoff.reject')}
            currentUserId={me?.id}
            currentUserEmail={me?.email}
            onGenerate={() => void run('Sign-off matrix generated.', () => signoffMutations.generate.mutateAsync())}
            onRequest={(signoff) => void run('Sign-off requested.', () => signoffMutations.request.mutateAsync({ signoffId: signoff.id, values: { message: 'Please complete HAZOP/PHA review sign-off.' } }))}
            onSign={(signoff) => setDialog({ type: 'sign', signoff })}
            onReject={(signoff) => setDialog({ type: 'rejectSignoff', signoff })}
          />
          <HazopReadinessChecklist checks={readiness?.checks ?? []} />
          <HazopReviewCommentsPanel
            comments={comments}
            loading={commentBusy}
            canAdd={can('hazop.review.comments.create')}
            canResolve={can('hazop.review.comments.resolve')}
            onAdd={(values) => void run('Review comment added.', () => commentMutations.add.mutateAsync(values))}
            onResolve={resolveComment}
            onCreateAction={createCommentAction}
          />
        </div>
        <div className="space-y-5">
          <HazopClosureBlockersPanel blockers={blockers} />
          <HazopElectronicSignaturePanel signoffs={signoffs} />
          <HazopFinalApprovalPanel
            readiness={readiness}
            status={study.status ?? workflow?.status}
            loading={workflowMutations.close.isPending || workflowMutations.reopen.isPending}
            canClose={can('hazop.review.close')}
            canReopen={can('hazop.review.reopen')}
            onClose={() => setDialog({ type: 'workflow', action: 'close', title: 'Close HAZOP Study', label: 'Closure comment' })}
            onReopen={() => setDialog({ type: 'workflow', action: 'reopen', title: 'Reopen HAZOP Study', label: 'Reopen reason' })}
          />
          <HazopApprovalTimeline workflow={workflow} />
          <HazopExportApprovalPackagePanel loading={workflowMutations.exportPackage.isPending} onExport={exportPackage} />
        </div>
      </div>
      {dialog?.type === 'sign' ? <SignDialog study={study} signoff={dialog.signoff} loading={signoffMutations.sign.isPending} onClose={() => setDialog(null)} onSubmit={(values) => void run('Sign-off completed.', () => signoffMutations.sign.mutateAsync({ signoffId: dialog.signoff.id, values }))} /> : null}
      {dialog?.type === 'rejectSignoff' ? <ReasonDialog title="Reject Sign-Off" label="Rejection reason" loading={signoffMutations.reject.isPending} onClose={() => setDialog(null)} onSubmit={(reason) => void run('Sign-off rejected.', () => signoffMutations.reject.mutateAsync({ signoffId: dialog.signoff.id, values: { reason } }))} /> : null}
      {dialog?.type === 'resolveComment' ? <ReasonDialog title="Resolve Review Comment" label="Resolution note" loading={commentMutations.resolve.isPending} onClose={() => setDialog(null)} onSubmit={(resolution) => void run('Review comment resolved.', () => commentMutations.resolve.mutateAsync({ commentId: dialog.comment.id, values: { resolution } }))} /> : null}
      {dialog?.type === 'workflow' ? <ReasonDialog title={dialog.title} label={dialog.label} loading={workflowActionPending(dialog.action, workflowMutations)} onClose={() => setDialog(null)} onSubmit={(reason) => void run(workflowSuccessMessage(dialog.action), () => runWorkflowAction(dialog.action, reason, workflowMutations))} /> : null}
    </div>
  );
}

function runWorkflowAction(action: 'reject' | 'return' | 'close' | 'reopen', reason: string, workflowMutations: ReturnType<typeof useHazopReviewWorkflow>) {
  if (action === 'reject') return workflowMutations.reject.mutateAsync({ reason });
  if (action === 'close') return workflowMutations.close.mutateAsync({ comment: reason });
  if (action === 'reopen') return workflowMutations.reopen.mutateAsync({ reason });
  return workflowMutations.returnForRework.mutateAsync({ reason });
}

function workflowSuccessMessage(action: 'reject' | 'return' | 'close' | 'reopen') {
  return action === 'reject' ? 'Review rejected.' : action === 'close' ? 'Study closed.' : action === 'reopen' ? 'Study reopened.' : 'Study returned for rework.';
}

function workflowActionPending(action: 'reject' | 'return' | 'close' | 'reopen', workflowMutations: ReturnType<typeof useHazopReviewWorkflow>) {
  if (action === 'reject') return workflowMutations.reject.isPending;
  if (action === 'close') return workflowMutations.close.isPending;
  if (action === 'reopen') return workflowMutations.reopen.isPending;
  return workflowMutations.returnForRework.isPending;
}

function SignDialog({ study, signoff, loading, onClose, onSubmit }: { study: any; signoff: HazopSignoff; loading?: boolean; onClose: () => void; onSubmit: (values: Record<string, any>) => void }) {
  const [comment, setComment] = useState('');
  const [identity, setIdentity] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const signerName = signoff.assignedUser?.displayName ?? 'Current authenticated user';
  return (
    <Modal title="Sign Electronically" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm">
          <div className="font-semibold">{study.study_number} · {study.title}</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Info label="Sign-off role" value={signoff.role ?? signoff.signoff_role ?? signoff.signature_role ?? '-'} />
            <Info label="Signer" value={signerName} />
            <Info label="Job title" value={signoff.assignedUser?.title ?? '-'} />
            <Info label="Status" value={signoff.status ?? 'Pending'} />
          </div>
        </div>
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-50">
          I confirm that I have reviewed this HAZOP/PHA study, including nodes, deviations, risk ranking, safeguards, recommendations, linked records, and closure blockers, and approve it for my assigned role.
        </div>
        <label className="block text-sm font-semibold">Username / identity confirmation</label>
        <input className="input w-full" value={identity} onChange={(event) => setIdentity(event.target.value)} placeholder="Re-enter your username or email" />
        <label className="block text-sm font-semibold">Comment</label>
        <textarea className="input min-h-24 w-full" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Optional sign-off comment" />
        <label className="flex items-start gap-2 text-sm text-[var(--psm-muted)]"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> I understand this creates an immutable HAZOP electronic sign-off record.</label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold">Cancel</button>
          <button disabled={loading || !confirmed || !identity.trim()} onClick={() => onSubmit({ confirmation: true, comment, identityConfirmation: identity })} className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-45">Sign / Approve My Role</button>
        </div>
      </div>
    </Modal>
  );
}

function ReasonDialog({ title, label, loading, onClose, onSubmit }: { title: string; label: string; loading?: boolean; onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <Modal title={title} onClose={onClose}>
      <label className="block text-sm font-semibold">{label}</label>
      <textarea className="input mt-2 min-h-28 w-full" value={reason} onChange={(event) => setReason(event.target.value)} />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold">Cancel</button>
        <button disabled={loading || !reason.trim()} onClick={() => onSubmit(reason)} className="rounded-lg border border-blue-400/30 bg-blue-500/15 px-3 py-2 text-sm font-semibold text-blue-100 disabled:opacity-45">Submit</button>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-auto rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--psm-line)] bg-[var(--psm-surface)] px-5 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-2 py-1 text-sm">Close</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="font-semibold">{value}</div></div>;
}

function Toast({ toast, onClose }: { toast: NonNullable<ToastState>; onClose: () => void }) {
  const color = toast.tone === 'success' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-50' : toast.tone === 'error' ? 'border-red-400/30 bg-red-500/15 text-red-50' : 'border-blue-400/30 bg-blue-500/15 text-blue-50';
  return <div className={`fixed right-4 top-4 z-[60] flex max-w-md items-center justify-between gap-4 rounded-xl border px-4 py-3 shadow-xl ${color}`}><span className="text-sm font-semibold">{safeText(toast.message)}</span><button onClick={onClose} className="text-xs opacity-80">Close</button></div>;
}

function StateCard({ tone, title, text }: { tone: 'red' | 'amber'; title: string; text: string }) {
  const color = tone === 'red' ? 'border-red-500/30 bg-red-500/10 text-red-100' : 'border-amber-500/30 bg-amber-500/10 text-amber-100';
  return <div className={`rounded-xl border p-4 ${color}`}><div className="font-semibold">{title}</div><p className="mt-1 text-sm opacity-80">{text}</p></div>;
}

function errorMessage(error: unknown) {
  const response = error as { response?: { data?: { message?: unknown; error?: unknown } }; message?: unknown };
  const message = response.response?.data?.message ?? response.response?.data?.error ?? response.message;
  return safeText(message) || 'Action failed. Please try again.';
}

function safeText(value: unknown): string {
  if (Array.isArray(value)) return value.map(safeText).filter(Boolean).join(', ');
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nested = record.message ?? record.error ?? record.statusCode;
    if (nested && nested !== value) return safeText(nested);
    try {
      return JSON.stringify(value);
    } catch {
      return 'Action failed. Please try again.';
    }
  }
  return value == null ? '' : String(value);
}

function currentUserFromToken() {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem('psm.accessToken');
  const payload = token?.split('.')[1];
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
    return {
      id: decoded.sub ?? decoded.userId ?? decoded.id,
      email: decoded.email
    };
  } catch {
    return null;
  }
}
