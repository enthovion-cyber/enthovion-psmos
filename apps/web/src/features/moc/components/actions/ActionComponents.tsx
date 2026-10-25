'use client';

import { ExternalLink, Plus, RefreshCcw, ShieldAlert, TrafficCone } from 'lucide-react';
import { useState } from 'react';
import { Badge, DetailCard, EmptyState, Field, Metric, ProgressBar, detailInput, detailTextarea } from '../moc-detail-ui';
import type { MOCActionValues } from '../../schemas/moc-actions.schema';

export function ClosedLoopSummaryCard({ summary }: { summary: any }) {
  const readiness = summary?.readinessStatus;
  return (
    <DetailCard
      title="Closed-Loop Action Summary & Gates"
      action={<Badge tone={readiness === 'Green' ? 'green' : readiness === 'Red' ? 'red' : 'amber'}>{readiness ?? 'Amber'}</Badge>}
    >
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
        <Metric label="Total Actions" value={summary?.totalRequiredActions ?? 0} tone="blue" />
        <Metric label="Completed" value={summary?.completedActions ?? 0} tone="green" />
        <Metric label="Open" value={summary?.openActions ?? 0} tone="amber" />
        <Metric label="Overdue" value={summary?.overdueActions ?? 0} tone="red" />
        <Metric label="Startup Blockers" value={summary?.startupBlockingActions ?? 0} tone={summary?.startupBlockingActions ? 'red' : 'green'} />
        <Metric label="Closure Blockers" value={summary?.closureBlockingActions ?? 0} tone={summary?.closureBlockingActions ? 'red' : 'green'} />
        <Metric label="Missing Evidence" value={summary?.actionsMissingEvidence ?? 0} tone={summary?.actionsMissingEvidence ? 'amber' : 'green'} />
        <Metric label="Pending Verification" value={summary?.actionsPendingVerification ?? 0} tone={summary?.actionsPendingVerification ? 'amber' : 'green'} />
      </div>
      <div className="mt-4">
        <ProgressBar value={summary?.completionPercentage ?? 0} tone={readiness === 'Red' ? 'red' : readiness === 'Green' ? 'green' : 'amber'} />
      </div>
    </DetailCard>
  );
}

export function StartupBlockersPanel({ blockers }: { blockers: any[] }) {
  return (
    <BlockerPanel
      title="Pre-Startup Timing Gate Blockers (PSSR Hard Gate)"
      blockers={blockers}
      empty="No open startup blockers. All Pre-Startup timing gate actions are verified and ready for PSSR sign-off."
    />
  );
}

export function ClosureBlockersPanel({ blockers }: { blockers: any[] }) {
  return (
    <BlockerPanel
      title="Closure Timing Gate Blockers"
      blockers={blockers}
      empty="No closure blockers. All Post-Startup actions are complete, evidenced, and verified."
    />
  );
}

function BlockerPanel({ title, blockers, empty }: { title: string; blockers: any[]; empty: string }) {
  return (
    <DetailCard
      title={title}
      action={<Badge tone={blockers.length ? 'red' : 'green'}>{blockers.length} Blocking</Badge>}
    >
      {!blockers.length ? (
        <EmptyState title={empty} />
      ) : (
        <div className="space-y-2">
          {blockers.map((item) => (
            <div key={item.id} className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="flex items-center gap-2 font-bold text-red-700 dark:text-red-200">
                <ShieldAlert size={15} />
                {item.title}
              </p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                {item.reason ?? item.description ?? item.source_type}
              </p>
            </div>
          ))}
        </div>
      )}
    </DetailCard>
  );
}

export function RequiredActionsTable({
  actions,
  onSelect,
  onUpdate
}: {
  actions: any[];
  onSelect: (action: any) => void;
  onUpdate: (actionId: string, values: Record<string, any>) => void;
}) {
  return (
    <DetailCard title="Closed-Loop Required Actions & Timing Gates">
      {!actions.length ? (
        <EmptyState title="No closed-loop actions generated yet. Generate actions from impact and risk assessment." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] text-left text-sm">
            <thead className="sticky top-0 bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)] border-b border-[var(--psm-line)]">
              <tr>
                {['Action Item', 'Timing Gate', 'Source', 'Module', 'Owner', 'Priority', 'Due Date', 'Status', 'Evidence', 'Verification', 'Gates', 'Action'].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {actions.map((action) => {
                const isPreStartup = action.required_before_startup || action.timing_gate === 'PRE_STARTUP' || action.timingGate === 'PRE_STARTUP';
                const isPostStartup = action.required_before_closure || action.timing_gate === 'POST_STARTUP' || action.timingGate === 'POST_STARTUP';

                return (
                  <tr key={action.id} className="hover:bg-[var(--psm-surface-2)] transition-colors">
                    <td className="px-3 py-3">
                      <p className="font-bold text-[var(--psm-fg)]">{action.action_title ?? action.title}</p>
                      <p className="text-xs text-[var(--psm-muted)]">{action.description}</p>
                    </td>
                    <td className="px-3 py-3">
                      {isPreStartup ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                          Pre-Startup (Hard Gate)
                        </span>
                      ) : isPostStartup ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          Post-Startup
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/10 px-2 py-0.5 text-xs text-[var(--psm-muted)]">
                          General
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-[var(--psm-muted)]">{action.source_type ?? action.source_impact_answer ?? 'Manual'}</td>
                    <td className="px-3 py-3 text-xs text-[var(--psm-muted)]">{action.linked_module ?? action.action_type}</td>
                    <td className="px-3 py-3 text-xs font-mono text-[var(--psm-fg)]">{action.owner_id ? String(action.owner_id).slice(0, 8) + '...' : '-'}</td>
                    <td className="px-3 py-3">
                      <Badge tone={action.priority === 'SAFETY_CRITICAL' || action.priority === 'HIGH' ? 'red' : action.priority === 'MEDIUM' ? 'amber' : 'green'}>
                        {action.priority}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-xs font-mono text-[var(--psm-fg)]">{action.due_date ?? '-'}</td>
                    <td className="px-3 py-3">
                      <select
                        className={detailInput}
                        value={action.status}
                        onChange={(e) => onUpdate(action.id, { status: e.target.value })}
                      >
                        <option>Preview</option>
                        <option>Created</option>
                        <option>In Progress</option>
                        <option>Pending Verification</option>
                        <option>Completed</option>
                        <option>Closed</option>
                        <option>No Longer Required</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      {action.evidence_required ? (
                        <Badge tone={['Uploaded', 'Accepted', 'Approved'].includes(action.evidence_status) ? 'green' : 'amber'}>
                          {action.evidence_status}
                        </Badge>
                      ) : (
                        <Badge tone="slate">Not Required</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {action.verification_required ? (
                        <Badge tone={action.verification_status === 'Verified' ? 'green' : 'amber'}>
                          {action.verification_status}
                        </Badge>
                      ) : (
                        <Badge tone="slate">Not Required</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className={action.required_before_approval ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-[var(--psm-muted)]'}>
                          Approval: {action.required_before_approval ? 'Yes' : 'No'}
                        </span>
                        <span className={action.required_before_startup ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-[var(--psm-muted)]'}>
                          Startup: {action.required_before_startup ? 'Yes' : 'No'}
                        </span>
                        <span className={action.required_before_closure ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-[var(--psm-muted)]'}>
                          Closure: {action.required_before_closure ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => onSelect(action)}
                        className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DetailCard>
  );
}

export function ActionGroupPanels({ actions }: { actions: any[] }) {
  const groups = [
    'Documents / PSI',
    'Engineering',
    'HAZOP / LOPA / PSSR',
    'Training',
    'Equipment Registry',
    'Operations / Procedures',
    'Environmental / Compliance',
    'Quality / Production',
    'Temporary / Emergency',
    'Manual'
  ];

  return (
    <DetailCard title="Action Group Health Panels">
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {groups.map((group) => {
          const rows = actions.filter((row) => groupFor(row) === group);
          return (
            <div key={group} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
              <p className="font-bold text-[var(--psm-fg)] text-sm">{group}</p>
              <div className="mt-2 grid grid-cols-4 gap-1 text-xs text-[var(--psm-muted)]">
                <span>Total<br /><b className="text-[var(--psm-fg)]">{rows.length}</b></span>
                <span>Done<br /><b className="text-emerald-600 dark:text-emerald-400">{rows.filter((r) => ['Completed', 'Closed'].includes(r.status)).length}</b></span>
                <span>Open<br /><b className="text-amber-600 dark:text-amber-400">{rows.filter((r) => !['Completed', 'Closed'].includes(r.status)).length}</b></span>
                <span>Gate<br /><b className="text-rose-600 dark:text-rose-400">{rows.filter((r) => r.required_before_startup || r.required_before_closure).length}</b></span>
              </div>
            </div>
          );
        })}
      </div>
    </DetailCard>
  );
}

export function MOCActionDetailDrawer({
  action,
  onClose,
  onNoLongerRequired
}: {
  action: any;
  onClose: () => void;
  onNoLongerRequired: (reason: string) => void;
}) {
  if (!action) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <aside className="ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-2xl text-[var(--psm-fg)]">
        <div className="mb-4 flex justify-between gap-3 border-b border-[var(--psm-line)] pb-4">
          <div>
            <p className="text-xs font-bold uppercase text-[var(--psm-muted)]">Action Detail & Timing Gate</p>
            <h3 className="text-xl font-black text-[var(--psm-fg)] mt-1">{action.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--psm-line)] px-3 py-1.5 text-sm text-[var(--psm-muted)] hover:text-[var(--psm-fg)]"
          >
            Close
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <Info label="Timing Gate" value={action.required_before_startup ? 'Pre-Startup (PSSR Hard Gate)' : action.required_before_closure ? 'Post-Startup' : 'General'} />
          <Info label="Owner" value={action.owner_id ?? 'Unassigned'} />
          <Info label="Source" value={action.source_type ?? 'Manual'} />
          <Info label="Linked MOC" value={action.moc_id ?? '-'} />
          <Info label="Due date" value={action.due_date ?? 'No deadline'} />
          <Info label="Evidence" value={`${action.evidence_required ? 'Required' : 'Not required'} · ${action.evidence_status ?? '-'}`} />
          <Info label="Verification" value={`${action.verification_required ? 'Required' : 'Not required'} · ${action.verification_status ?? '-'}`} />

          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <p className="text-xs font-semibold uppercase text-[var(--psm-muted)] mb-1">Description</p>
            <p className="text-sm">{action.description || 'No description provided.'}</p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href={action.action_id ? `/actions/${action.action_id}` : '#'}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
            >
              Open Universal Action Engine <ExternalLink size={14} />
            </a>
            <button
              type="button"
              onClick={() => {
                const reason = window.prompt('Reason this action is no longer required?');
                if (reason) onNoLongerRequired(reason);
              }}
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-300 hover:bg-red-500/20 transition-colors"
            >
              Mark No Longer Required
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function EvidenceVerificationStatus({ actions }: { actions: any[] }) {
  const evidenceUploaded = actions.filter((row) => ['Uploaded', 'Accepted', 'Approved'].includes(row.evidence_status)).length;
  const missing = actions.filter((row) => row.evidence_required && !['Uploaded', 'Accepted', 'Approved'].includes(row.evidence_status)).length;
  const verified = actions.filter((row) => row.verification_status === 'Verified').length;
  const pending = actions.filter((row) => row.verification_required && row.verification_status !== 'Verified').length;

  return (
    <DetailCard title="Evidence & Verification Quality Status">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Metric label="Evidence Uploaded" value={evidenceUploaded} tone="green" />
        <Metric label="Evidence Missing" value={missing} tone={missing ? 'red' : 'green'} />
        <Metric label="Verification Approved" value={verified} tone="green" />
        <Metric label="Verification Pending" value={pending} tone={pending ? 'amber' : 'green'} />
      </div>
    </DetailCard>
  );
}

export function GenerateSyncActionsControls({
  onGenerate,
  onSync,
  onCreateUniversal,
  onCustom,
  busy
}: {
  onGenerate: () => void;
  onSync: (source?: string) => void;
  onCreateUniversal: () => void;
  onCustom: (values: MOCActionValues) => void;
  busy?: boolean;
}) {
  const [custom, setCustom] = useState<MOCActionValues>({
    title: '',
    description: '',
    actionType: 'Manual',
    linkedModule: 'Manual',
    priority: 'MEDIUM',
    dueDate: '',
    requiredBeforeApproval: false,
    requiredBeforeStartup: false,
    requiredBeforeClosure: true,
    evidenceRequired: true,
    verificationRequired: true
  });

  const update = (patch: Partial<MOCActionValues>) => setCustom((current) => ({ ...current, ...patch }));

  return (
    <DetailCard
      title="Generate / Sync Actions & Universal Action Engine Gate"
      action={
        <button
          type="button"
          onClick={onGenerate}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCcw size={14} className={busy ? 'animate-spin' : ''} />
          {busy ? 'Generating...' : 'Generate Required Actions'}
        </button>
      }
    >
      <div className="flex flex-wrap gap-2">
        {['Impact Assessment', 'Risk Ranking', 'Engineering Package', 'Temporary / Emergency controls'].map((source) => (
          <button
            key={source}
            type="button"
            disabled={busy}
            onClick={() => onSync(source)}
            className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-fg)] hover:border-primary/50 disabled:opacity-50 transition-colors"
          >
            Sync with {source}
          </button>
        ))}
        <button
          type="button"
          onClick={onCreateUniversal}
          disabled={busy}
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
        >
          Create Universal Actions in Action Center
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Field label="Custom Action Title">
          <input className={detailInput} value={custom.title} onChange={(e) => update({ title: e.target.value })} placeholder="Enter action title..." />
        </Field>
        <Field label="Linked Module">
          <input className={detailInput} value={custom.linkedModule} onChange={(e) => update({ linkedModule: e.target.value })} placeholder="e.g. Training, P&ID, MI" />
        </Field>
        <Field label="Priority">
          <select className={detailInput} value={custom.priority} onChange={(e) => update({ priority: e.target.value })}>
            <option>LOW</option>
            <option>MEDIUM</option>
            <option>HIGH</option>
            <option>SAFETY_CRITICAL</option>
          </select>
        </Field>
        <Field label="Due Date">
          <input className={detailInput} type="date" value={custom.dueDate ?? ''} onChange={(e) => update({ dueDate: e.target.value })} />
        </Field>
        <div className="md:col-span-4">
          <Field label="Description & Acceptance Criteria">
            <textarea className={detailTextarea} value={custom.description ?? ''} onChange={(e) => update({ description: e.target.value })} placeholder="Describe action requirements and evidence needed..." />
          </Field>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--psm-line)] pt-3 text-xs text-[var(--psm-fg)]">
        <div className="flex flex-wrap gap-4">
          {(['requiredBeforeApproval', 'requiredBeforeStartup', 'requiredBeforeClosure', 'evidenceRequired', 'verificationRequired'] as const).map((key) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(custom[key])}
                onChange={(e) => update({ [key]: e.target.checked } as any)}
                className="rounded border-[var(--psm-line)] text-primary focus:ring-primary"
              />
              <span className={key === 'requiredBeforeStartup' ? 'font-bold text-rose-600 dark:text-rose-400' : ''}>
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </span>
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => custom.title && onCustom(custom)}
          disabled={!custom.title.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={14} /> Add Custom Action
        </button>
      </div>
    </DetailCard>
  );
}

export function TrafficLightClosureChecklist({ items, onRecalculate }: { items: any[]; onRecalculate: () => void }) {
  const tone: Record<string, 'green' | 'amber' | 'red' | 'slate'> = { Green: 'green', Amber: 'amber', Red: 'red', Gray: 'slate' };

  return (
    <DetailCard
      title="Traffic Light Closure Checklist & Hard Readiness Verification"
      action={
        <button
          type="button"
          onClick={onRecalculate}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-bold text-[var(--psm-fg)] hover:border-primary/50 transition-colors"
        >
          <TrafficCone size={14} /> Recalculate
        </button>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.id ?? item.checklist_key} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[var(--psm-fg)]">{item.title}</p>
              <Badge tone={tone[item.status] ?? 'slate'}>{item.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              {item.required ? `Required before ${item.blocking_stage}` : 'Not required'}
            </p>
          </div>
        ))}
      </div>
    </DetailCard>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--psm-muted)] font-semibold">{label}</p>
      <p className="mt-1 font-bold text-[var(--psm-fg)]">{value}</p>
    </div>
  );
}

function groupFor(row: any) {
  const text = `${row.action_type ?? ''} ${row.linked_module ?? ''} ${row.source_type ?? ''}`.toLowerCase();
  if (text.includes('document') || text.includes('sop') || text.includes('sds') || text.includes('psi')) return 'Documents / PSI';
  if (text.includes('engineering')) return 'Engineering';
  if (text.includes('hazop') || text.includes('lopa') || text.includes('pssr')) return 'HAZOP / LOPA / PSSR';
  if (text.includes('training')) return 'Training';
  if (text.includes('equipment')) return 'Equipment Registry';
  if (text.includes('procedure') || text.includes('operation')) return 'Operations / Procedures';
  if (text.includes('environment')) return 'Environmental / Compliance';
  if (text.includes('quality') || text.includes('production')) return 'Quality / Production';
  if (text.includes('temporary') || text.includes('emergency')) return 'Temporary / Emergency';
  return 'Manual';
}
