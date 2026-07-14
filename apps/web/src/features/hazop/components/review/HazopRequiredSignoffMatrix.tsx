import type { HazopSignoff } from '../../types/hazop-signoff.types';
import { Button } from './HazopApprovalWorkflowPanel';
import { Panel } from './HazopReadinessChecklist';

type MatrixProps = {
  signoffs: HazopSignoff[];
  canGenerate?: boolean;
  canRequest?: boolean;
  canSign?: boolean;
  canReject?: boolean;
  readOnly?: boolean;
  loadingAction?: { generate?: boolean; request?: boolean; sign?: boolean; reject?: boolean };
  currentUserId?: string | undefined;
  currentUserEmail?: string | undefined;
  onGenerate: () => void;
  onRequest: (signoff: HazopSignoff) => void;
  onSign: (signoff: HazopSignoff) => void;
  onReject: (signoff: HazopSignoff) => void;
};

export function HazopRequiredSignoffMatrix({ signoffs, canGenerate, canRequest, canSign, canReject, readOnly, loadingAction, currentUserId, currentUserEmail, onGenerate, onRequest, onSign, onReject }: MatrixProps) {
  const required = signoffs.filter((signoff) => signoff.required !== false);
  const signed = required.filter((signoff) => signoff.status === 'Signed').length;
  const pending = required.filter((signoff) => !['Signed', 'Rejected', 'Not Required', 'Superseded'].includes(signoff.status ?? '')).length;
  return (
    <Panel title="Required Sign-off Matrix">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <Metric label="Required" value={required.length} />
          <Metric label="Signed" value={signed} tone="green" />
          <Metric label="Pending" value={pending} tone="amber" />
        </div>
        {canGenerate ? <Button disabled={readOnly || loadingAction?.generate} onClick={onGenerate}>{loadingAction?.generate ? 'Generating...' : signoffs.length ? 'Regenerate Missing Rows' : 'Generate Sign-Off Matrix'}</Button> : null}
      </div>
      {!signoffs.length ? (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-6 text-center">
          <div className="font-semibold">No sign-off matrix exists yet.</div>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">Generate required sign-off records from the study team, site policy, risk level, and MOC/PSSR links.</p>
          {canGenerate ? <div className="mt-4"><Button disabled={readOnly || loadingAction?.generate} onClick={onGenerate}>{loadingAction?.generate ? 'Generating...' : 'Generate Sign-Off Matrix'}</Button></div> : null}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
              <tr>{['Role', 'Required', 'Assigned person', 'Discipline', 'Status', 'Requested at', 'Signed at', 'Comments', 'E-signature', 'Actions'].map((h) => <th key={h} className="px-3 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {signoffs.map((signoff) => {
                const immutable = ['Signed', 'Superseded', 'Not Required'].includes(signoff.status ?? '');
                const assignedUserId = signoff.assigned_user_id ?? signoff.signer_user_id;
                const assignedEmail = signoff.assignedUser?.email;
                const currentUserKnown = Boolean(currentUserId || currentUserEmail);
                const isAssignedReviewer = currentUserKnown
                  ? Boolean((currentUserId && assignedUserId === currentUserId) || (currentUserEmail && assignedEmail && assignedEmail.toLowerCase() === currentUserEmail.toLowerCase()))
                  : Boolean(assignedUserId || assignedEmail);
                return (
                  <tr key={signoff.id} className="border-t border-[var(--psm-line)] align-top">
                    <td className="px-3 py-3 font-semibold text-[var(--psm-text)]">{signoff.role ?? signoff.signoff_role ?? signoff.signature_role}</td>
                    <td className="px-3 py-3">{signoff.required === false ? 'No' : 'Yes'}</td>
                    <td className="px-3 py-3"><Person name={safeText(signoff.assignedUser?.displayName ?? (signoff.assigned_user_id ? signoff.assigned_user_id : 'Missing Assignee'))} email={safeText(signoff.assignedUser?.email)} department={safeText(signoff.assignedUser?.department)} missing={!signoff.assigned_user_id && !signoff.signer_user_id} /></td>
                    <td className="px-3 py-3">{safeText(signoff.assignedUser?.department ?? signoff.discipline ?? '-')}</td>
                    <td className="px-3 py-3"><Status value={signoff.status} missing={!signoff.assigned_user_id && !signoff.signer_user_id} /></td>
                    <td className="px-3 py-3 text-[var(--psm-muted)]">{formatDate(signoff.requested_at)}</td>
                    <td className="px-3 py-3 text-[var(--psm-muted)]">{formatDate(signoff.signed_at)}</td>
                    <td className="px-3 py-3 max-w-[220px] text-[var(--psm-muted)]">{signoff.comment ?? signoff.rejection_reason ?? '-'}</td>
                    <td className="px-3 py-3">{signoff.e_signature_id ? <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-200">Captured</span> : <span className="text-[var(--psm-muted)]">Pending</span>}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {canRequest ? <button disabled={readOnly || loadingAction?.request || immutable} onClick={() => onRequest(signoff)} className="text-xs text-primary disabled:opacity-40">{loadingAction?.request ? 'Requesting...' : 'Request'}</button> : null}
                        {canSign && isAssignedReviewer ? <button disabled={readOnly || loadingAction?.sign || signoff.status === 'Signed' || signoff.status === 'Superseded'} onClick={() => onSign(signoff)} className="text-xs text-emerald-300 disabled:opacity-40">{loadingAction?.sign ? 'Signing...' : 'Sign Now'}</button> : null}
                        {canReject ? <button disabled={readOnly || loadingAction?.reject || immutable} onClick={() => onReject(signoff)} className="text-xs text-red-300 disabled:opacity-40">{loadingAction?.reject ? 'Rejecting...' : 'Reject'}</button> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function Status({ value, missing }: { value?: string | undefined; missing?: boolean | undefined }) {
  const color = missing ? 'border-red-400/30 bg-red-500/15 text-red-200' : value === 'Signed' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200' : value === 'Rejected' || value === 'Returned for Rework' ? 'border-red-400/30 bg-red-500/15 text-red-200' : value === 'Requested' || value === 'Pending Sign-Off' ? 'border-blue-400/30 bg-blue-500/15 text-blue-200' : 'border-amber-400/30 bg-amber-500/15 text-amber-200';
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${color}`}>{missing ? 'Missing Assignee' : value ?? 'Pending Request'}</span>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: 'green' | 'amber' }) {
  const color = tone === 'green' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : 'text-[var(--psm-text)]';
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><div className={`text-lg font-semibold ${color}`}>{value}</div><div className="text-xs text-[var(--psm-muted)]">{label}</div></div>;
}

function Person({ name, email, department, missing }: { name?: string | undefined; email?: string | undefined; department?: string | undefined; missing?: boolean | undefined }) {
  const initials = String(name ?? 'U').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
  return <div className="flex items-center gap-2"><span className={`grid size-7 place-items-center rounded-full border text-[11px] font-semibold ${missing ? 'border-red-400/30 bg-red-500/15 text-red-100' : 'border-blue-400/30 bg-blue-500/15 text-blue-100'}`}>{initials}</span><span><span className={`block font-medium ${missing ? 'text-red-200' : ''}`}>{name}</span>{email ? <span className="block text-xs text-[var(--psm-muted)]">{email}</span> : null}{department ? <span className="block text-xs text-[var(--psm-muted)]">{department}</span> : null}</span></div>;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : '-';
}

function safeText(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return safeText(record.displayName ?? record.name ?? record.title ?? record.message ?? '') || '-';
  }
  return value == null ? undefined : String(value);
}
