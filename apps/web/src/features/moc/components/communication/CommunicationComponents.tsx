'use client';

import { Bell, CheckCircle2, Send, Users } from 'lucide-react';
import { Badge, DetailCard, EmptyState, Field, Metric, MocButton, detailInput, detailTextarea, statusTone } from '../moc-detail-ui';

export function CommunicationTrainingSummaryCard({ summary }: { summary: any }) {
  return (
    <DetailCard title="Communication & Training Summary">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
        <Metric label="Communication" value={summary?.communicationStatus ?? 'Not Started'} tone={statusTone(summary?.communicationStatus)} />
        <Metric label="Training Required" value={summary?.trainingRequired ? 'Yes' : 'No'} tone={summary?.trainingRequired ? 'amber' : 'slate'} />
        <Metric label="Training" value={`${summary?.trainingCompletionPercent ?? 0}%`} tone={(summary?.trainingCompletionPercent ?? 0) === 100 ? 'green' : 'amber'} />
        <Metric label="Acknowledgement" value={`${summary?.acknowledgementCompletionPercent ?? 0}%`} tone={(summary?.acknowledgementCompletionPercent ?? 0) === 100 ? 'green' : 'amber'} />
        <Metric label="Blockers" value={summary?.startupBlockingTrainingIncompleteCount ?? 0} tone={(summary?.startupBlockingTrainingIncompleteCount ?? 0) ? 'red' : 'green'} />
      </div>
      <div className="mt-4 grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 sm:grid-cols-2 md:grid-cols-4">
        <Info label="Total Stakeholders" value={summary?.totalStakeholders ?? 0} />
        <Info label="Pending Acknowledgements" value={summary?.pendingAcknowledgements ?? 0} />
        <Info label="Required Roles" value={(summary?.requiredTrainingRoles ?? []).join(', ') || '-'} />
        <Info label="Last Communication" value={summary?.lastCommunicationSent ? new Date(summary.lastCommunicationSent).toLocaleString() : '-'} />
      </div>
    </DetailCard>
  );
}

export function StakeholdersPanel({ rows, draft, setDraft, onAdd, onImportImpact, onImportEquipment }: any) {
  return (
    <DetailCard
      title="Stakeholders / Affected Groups Panel"
      action={
        <div className="flex gap-2">
          <MocButton variant="outline" onClick={onImportImpact}>Import Impact</MocButton>
          <MocButton variant="outline" onClick={onImportEquipment}>Import Equipment</MocButton>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Stakeholder Type">
          <select className={detailInput} value={draft.stakeholderType} onChange={(e) => setDraft((v: any) => ({ ...v, stakeholderType: e.target.value }))}>
            {['Operations','Maintenance','Engineering','HSE','Control Room','Contractors','Production Planning','Quality','Laboratory','Inspection / Mechanical Integrity','Management','Security','Emergency Response','Other'].map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Notes">
          <input className={detailInput} value={draft.notes ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, notes: e.target.value }))} />
        </Field>
        <label className="mt-6 flex items-center gap-2 text-sm text-[var(--psm-fg)]">
          <input type="checkbox" checked={Boolean(draft.acknowledgementRequired)} onChange={(e) => setDraft((v: any) => ({ ...v, acknowledgementRequired: e.target.checked }))} className="rounded border-[var(--psm-line)] text-primary focus:ring-primary" />
          Ack required
        </label>
        <div className="mt-4 flex items-end">
          <MocButton variant="primary" onClick={onAdd} icon={<Users className="h-4 w-4" />}>
            Add Stakeholder
          </MocButton>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {rows?.length ? (
          rows.map((row: any) => (
            <div key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5">
              <div className="flex items-center justify-between">
                <p className="font-black text-[var(--psm-fg)]">{row.stakeholder_type}</p>
                <Badge tone={row.training_required ? 'amber' : 'slate'}>{row.training_required ? 'Training' : 'Comms'}</Badge>
              </div>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">Ack {row.acknowledgement_required ? 'required' : 'not required'} · Startup {row.required_before_startup ? 'yes' : 'no'} · Closure {row.required_before_closure ? 'yes' : 'no'}</p>
              <p className="mt-1 text-sm text-[var(--psm-fg)]">{row.notes}</p>
            </div>
          ))
        ) : (
          <EmptyState title="No stakeholders or affected groups yet." />
        )}
      </div>
    </DetailCard>
  );
}

export function CommunicationPlanPanel({ plan, draft, setDraft, onSave, onSend, onSchedule }: any) {
  return (
    <DetailCard
      title="Communication Plan Panel"
      action={
        <div className="flex gap-2">
          <MocButton variant="outline" onClick={onSchedule}>Schedule</MocButton>
          <MocButton variant="primary" onClick={onSend} icon={<Send className="h-4 w-4" />}>Send</MocButton>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Objective">
          <input className={detailInput} value={draft.objective ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, objective: e.target.value }))} />
        </Field>
        <Field label="Method">
          <select className={detailInput} value={draft.method ?? 'In-app notification'} onChange={(e) => setDraft((v: any) => ({ ...v, method: e.target.value }))}>
            {['Email','In-app notification','Toolbox talk','Shift briefing','Control room briefing','Training session','Contractor briefing','Meeting','Other'].map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Effective Date">
          <input className={detailInput} type="date" value={draft.effectiveDate ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, effectiveDate: e.target.value }))} />
        </Field>
        <Field label="Planned Date">
          <input className={detailInput} type="datetime-local" value={String(draft.plannedDate ?? '').slice(0, 16)} onChange={(e) => setDraft((v: any) => ({ ...v, plannedDate: e.target.value }))} />
        </Field>
        <Field label="Message Summary">
          <textarea className={detailTextarea} value={draft.messageSummary ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, messageSummary: e.target.value }))} />
        </Field>
        <Field label="Safety Precautions">
          <textarea className={detailTextarea} value={draft.safetyPrecautions ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, safetyPrecautions: e.target.value }))} />
        </Field>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <MocButton variant="outline" onClick={onSave}>Save Communication Plan</MocButton>
        <p className="text-xs text-[var(--psm-muted)]">Current status: <span className="font-bold text-[var(--psm-fg)]">{plan?.status ?? 'Not Started'}</span></p>
      </div>
    </DetailCard>
  );
}

export function CommunicationLogTable({ rows, onResend, onReminder }: any) {
  return (
    <DetailCard title="Communication Log">
      {rows?.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
              <tr>
                {['ID','Method','Subject','Sent To','Sent By','Sent At','Status','Actions'].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {rows.map((row: any) => (
                <tr key={row.id} className="text-[var(--psm-fg)] transition-colors hover:bg-[var(--psm-surface-2)]">
                  <td className="px-3 py-3 font-semibold">{row.communication_number ?? row.id.slice(0,8)}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.method}</td>
                  <td className="px-3 py-3">{row.subject}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.sent_to?.length ?? 0}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.sent_by}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.sent_at ? new Date(row.sent_at).toLocaleString() : '-'}</td>
                  <td className="px-3 py-3"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <MocButton variant="outline" onClick={() => onResend(row.id)}>Resend</MocButton>
                      <MocButton variant="outline" onClick={() => onReminder(row.id)} icon={<Bell className="h-3 w-3" />}>Reminder</MocButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No communication logs yet." />
      )}
    </DetailCard>
  );
}

export function AcknowledgementTracker({ rows, onAck, onWaive }: any) {
  return (
    <DetailCard title="Acknowledgement Tracker">
      {rows?.length ? (
        <div className="grid gap-2">
          {rows.map((row: any) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5">
              <div>
                <p className="font-bold text-[var(--psm-fg)]">{row.user_id ?? row.role_id ?? row.stakeholder_id ?? 'Group acknowledgement'}</p>
                <p className="text-xs text-[var(--psm-muted)]">Reminders {row.reminder_count ?? 0} · {row.acknowledged_at ? new Date(row.acknowledged_at).toLocaleString() : 'Pending'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                <MocButton variant="primary" onClick={() => onAck(row.id)} icon={<CheckCircle2 className="h-4 w-4" />}>Acknowledge</MocButton>
                <MocButton variant="outline" onClick={() => onWaive(row.id)}>Waive</MocButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No acknowledgement assignments yet." />
      )}
    </DetailCard>
  );
}

export function StartupTrainingBlockersPanel({ rows }: any) {
  return (
    <DetailCard title="Startup Training Blockers Panel">
      {rows?.length ? (
        <div className="space-y-2">
          {rows.map((row: any) => (
            <div key={`${row.type}-${row.id}`} className="rounded-xl border border-red-500/25 bg-red-500/10 p-4">
              <p className="font-black text-red-700 dark:text-red-200">{row.title}</p>
              <p className="text-xs text-red-600 dark:text-red-300">{row.type} · {row.severity}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No communication or training startup blockers." />
      )}
    </DetailCard>
  );
}

function Info({ label, value }: any) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">{label}</p>
      <p className="mt-1 font-bold text-[var(--psm-fg)]">{value ?? '-'}</p>
    </div>
  );
}
