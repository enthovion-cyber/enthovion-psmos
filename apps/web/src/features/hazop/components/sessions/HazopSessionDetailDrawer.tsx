'use client';

import type { HazopSession } from '../../types/hazop-session.types';
import { HazopAttendanceRegister } from './HazopAttendanceRegister';
import { HazopSessionActionPanel } from './HazopSessionActionPanel';
import { HazopSessionDecisionPanel } from './HazopSessionDecisionPanel';
import { HazopSessionMinutesPanel } from './HazopSessionMinutesPanel';
import { HazopSessionStatusBadge } from './HazopSessionStatusBadge';

export function HazopSessionDetailDrawer({ session, context, readonly, permissions, onClose, onEdit, onStart, onComplete, onCancel, onMarkAttendance, onSaveMinutes, onApproveMinutes, onAddDecision, onDeleteDecision, onCreateAction, onSyncActions }: { session: HazopSession; context?: any; readonly?: boolean; permissions: Record<string, boolean>; onClose: () => void; onEdit: () => void; onStart: () => void; onComplete: () => void; onCancel: () => void; onMarkAttendance: (values: Record<string, any>) => void; onSaveMinutes: (values: Record<string, any>, minutesId?: string) => void; onApproveMinutes: (minutesId: string) => void; onAddDecision: (values: Record<string, any>) => void; onDeleteDecision: (decisionId: string) => void; onCreateAction: (values: Record<string, any>) => void; onSyncActions: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <aside className="h-full w-full max-w-3xl overflow-y-auto border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><div className="mb-2"><HazopSessionStatusBadge value={session.status} /></div><h3 className="text-xl font-semibold">S{session.session_number} · {session.title}</h3><p className="mt-1 text-sm text-[var(--psm-muted)]">{session.session_date ?? 'No date'} · {session.start_time ?? '--'} - {session.end_time ?? '--'} · {session.location ?? 'No location'}</p></div><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-3 py-2">Close</button></div>
        <div className="mt-4 flex flex-wrap gap-2">{permissions.edit && !readonly ? <button onClick={onEdit} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Edit</button> : null}{permissions.edit && !readonly ? <button onClick={onStart} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm">Start</button> : null}{permissions.complete && !readonly ? <button onClick={onComplete} className="rounded-lg border border-emerald-500/30 px-4 py-2 text-sm text-emerald-200">Complete</button> : null}{permissions.cancel && !readonly ? <button onClick={onCancel} className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-300">Cancel</button> : null}</div>
        <section className="mt-5 rounded-xl border border-[var(--psm-line)] p-4"><h4 className="font-semibold">Session Summary, Agenda & Planned Nodes</h4><p className="mt-2 whitespace-pre-wrap text-sm text-[var(--psm-muted)]">{session.description ?? 'No session summary captured.'}</p><p className="mt-3 whitespace-pre-wrap text-sm text-[var(--psm-muted)]">{session.agenda ?? 'No agenda captured.'}</p><div className="mt-3 flex flex-wrap gap-2">{(session.plannedNodes ?? []).map((node: any) => <span key={node.id} className="rounded-md border border-[var(--psm-line)] px-2 py-1 text-xs">{node.node_number} {node.title}</span>)}</div></section>
        <div className="mt-5 grid gap-4"><HazopAttendanceRegister session={session} readonly={readonly} canManage={permissions.attendance} onMark={onMarkAttendance} /><HazopSessionMinutesPanel session={session} context={context} readonly={readonly} canManage={permissions.minutes} onSave={onSaveMinutes} onApprove={onApproveMinutes} /><HazopSessionDecisionPanel session={session} context={context} readonly={readonly} canManage={permissions.decisions} onAdd={onAddDecision} onDelete={onDeleteDecision} /><HazopSessionActionPanel session={session} context={context} readonly={readonly} canCreate={permissions.actions} onCreate={onCreateAction} onSync={onSyncActions} /><SessionHistory events={session.history ?? []} /></div>
      </aside>
    </div>
  );
}

function SessionHistory({ events }: { events: any[] }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] p-4">
      <h4 className="font-semibold">Session History</h4>
      <div className="mt-3 space-y-2">
        {events.map((event) => (
          <div key={event.id} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm">
            <div className="font-semibold">{event.title ?? event.event_type}</div>
            <div className="text-xs text-[var(--psm-muted)]">{event.created_at ? new Date(event.created_at).toLocaleString() : ''}</div>
          </div>
        ))}
        {!events.length ? <div className="text-sm text-[var(--psm-muted)]">No session-specific history events yet.</div> : null}
      </div>
    </section>
  );
}
