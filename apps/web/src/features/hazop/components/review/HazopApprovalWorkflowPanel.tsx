import type { ReactNode } from 'react';
import type { HazopApprovalWorkflow } from '../../types/hazop-review.types';
import type { HazopSignoff } from '../../types/hazop-signoff.types';
import { Panel } from './HazopReadinessChecklist';

type WorkflowPanelProps = {
  workflow?: HazopApprovalWorkflow;
  signoffs?: HazopSignoff[];
  readOnly?: boolean;
  loadingAction?: { start?: boolean; requestApproval?: boolean; approve?: boolean; reject?: boolean; return?: boolean };
  canStart?: boolean;
  canRequestApproval?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  canReturn?: boolean;
  onStart: () => void;
  onRequestApproval: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReturn: () => void;
};

const REQUIRED_STAGES = ['HAZOP Leader / Facilitator', 'Scribe', 'Process Engineer', 'Operations Representative', 'Maintenance Representative', 'Instrument / Controls Engineer', 'HSE Representative', 'Area Owner', 'Plant Manager / Approver', 'Final Closure Approval'];

export function HazopApprovalWorkflowPanel({ workflow, signoffs = [], readOnly, loadingAction, canStart = true, canRequestApproval = true, canApprove = true, canReject = true, canReturn = true, onStart, onRequestApproval, onApprove, onReject, onReturn }: WorkflowPanelProps) {
  const status = workflow?.status ?? 'Not Started';
  const currentStep = workflow?.current_step ?? 'Preparation';
  const stages = buildStages(signoffs);
  return (
    <Panel title="Approval Workflow">
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Info label="Workflow status" value={status} />
        <Info label="Current step" value={currentStep} />
        <Info label="Approval model" value={workflow?.workflow_name ?? 'HAZOP controlled review'} />
      </div>
      <div className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {stages.map((stage, index) => {
          const active = ['Requested', 'Pending Sign-Off', 'Signed', 'Approved', 'Closed'].includes(stage.status);
          return (
            <div key={`${stage.role}-${stage.userId ?? index}`} className={`rounded-lg border p-3 text-xs ${stage.missing ? 'border-red-400/30 bg-red-500/10 text-red-100' : active ? 'border-blue-400/40 bg-blue-500/10 text-blue-100' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'}`}>
              <div className="flex items-start gap-2">
                <Avatar name={stage.name} missing={stage.missing} />
                <div className="min-w-0">
                  <div className="font-semibold">{index + 1}. {stage.role}</div>
                  <div className="mt-1 truncate">{stage.name}</div>
                  <div className="truncate text-[var(--psm-muted)]">{stage.department || stage.email || 'No department'}</div>
                </div>
              </div>
              <div className="mt-3 grid gap-1">
                <MiniRow label="Status" value={stage.status} tone={stage.missing ? 'red' : stage.status === 'Signed' ? 'green' : active ? 'blue' : 'amber'} />
                <MiniRow label="Waiting on" value={stage.status === 'Signed' ? '-' : stage.name} />
                <MiniRow label="Completed" value={stage.completedAt ? new Date(stage.completedAt).toLocaleString() : '-'} />
                {stage.comment ? <MiniRow label="Comment" value={stage.comment} /> : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {canStart ? <Button disabled={readOnly || loadingAction?.start} onClick={onStart}>{loadingAction?.start ? 'Starting...' : 'Start Review'}</Button> : null}
        {canRequestApproval ? <Button disabled={readOnly || loadingAction?.requestApproval} onClick={onRequestApproval}>{loadingAction?.requestApproval ? 'Requesting...' : 'Request Approval'}</Button> : null}
        {canApprove ? <Button disabled={readOnly || loadingAction?.approve} onClick={onApprove}>{loadingAction?.approve ? 'Approving...' : 'Approve'}</Button> : null}
        {canReturn ? <Button disabled={readOnly || loadingAction?.return} onClick={onReturn}>{loadingAction?.return ? 'Returning...' : 'Return for Rework'}</Button> : null}
        {canReject ? <Button danger disabled={readOnly || loadingAction?.reject} onClick={onReject}>{loadingAction?.reject ? 'Rejecting...' : 'Reject'}</Button> : null}
      </div>
    </Panel>
  );
}

function buildStages(signoffs: HazopSignoff[]) {
  const rows = signoffs.map((signoff) => ({
    role: signoff.role ?? signoff.signoff_role ?? signoff.signature_role ?? 'HAZOP Sign-off',
    name: safeText(signoff.assignedUser?.displayName ?? (signoff.assigned_user_id ? signoff.assigned_user_id : 'Missing Assignee')),
    email: safeText(signoff.assignedUser?.email),
    department: safeText(signoff.assignedUser?.department ?? signoff.discipline),
    status: signoff.status ?? 'Pending Request',
    userId: signoff.assigned_user_id ?? signoff.signer_user_id,
    completedAt: signoff.signed_at ?? signoff.rejected_at,
    comment: signoff.comment ?? signoff.rejection_reason,
    missing: !(signoff.assigned_user_id ?? signoff.signer_user_id) && signoff.required !== false
  }));
  const missingRequired = REQUIRED_STAGES.filter((role) => !rows.some((row) => roleMatches(row.role, role))).map((role) => ({
    role,
    name: 'Missing Assignee',
    email: undefined,
    department: undefined,
    status: 'Pending Request',
    userId: undefined,
    completedAt: undefined,
    comment: undefined,
    missing: true
  }));
  return rows.length ? [...rows, ...missingRequired] : missingRequired;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/^hazop\s+/, '').replace(/\bcontrols\b/g, 'control').replace(/\band\b/g, '').replace(/[^a-z0-9]+/g, '');
}

function roleMatches(actual: string, required: string) {
  const a = normalize(actual);
  const r = normalize(required);
  return a === r || a.includes(r) || r.includes(a);
}

function safeText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return safeText(record.displayName ?? record.name ?? record.title ?? record.message ?? '') || '-';
  }
  return value == null ? '' : String(value);
}

function Avatar({ name, missing }: { name: string; missing?: boolean }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
  return <span className={`grid size-8 shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${missing ? 'border-red-400/30 bg-red-500/15 text-red-100' : 'border-blue-400/30 bg-blue-500/15 text-blue-100'}`}>{initials}</span>;
}

function MiniRow({ label, value, tone }: { label: string; value: string; tone?: 'red' | 'green' | 'blue' | 'amber' }) {
  const color = tone === 'red' ? 'text-red-300' : tone === 'green' ? 'text-emerald-300' : tone === 'blue' ? 'text-blue-300' : tone === 'amber' ? 'text-amber-300' : 'text-[var(--psm-text)]';
  return <div className="flex justify-between gap-3"><span className="text-[var(--psm-muted)]">{label}</span><span className={`truncate text-right font-medium ${color}`}>{value || '-'}</span></div>;
}

function Info({ label, value }: { label: string; value: any }) {
  return <div className="rounded-lg border border-[var(--psm-line)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="font-semibold">{value ?? '-'}</div></div>;
}

export function Button({ children, onClick, danger, disabled }: { children: ReactNode; onClick: () => void; danger?: boolean | undefined; disabled?: boolean | undefined }) {
  return <button disabled={disabled} onClick={onClick} className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${disabled ? 'cursor-not-allowed opacity-45' : danger ? 'border-red-500/30 text-red-200 hover:bg-red-500/10' : 'border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]'}`}>{children}</button>;
}
