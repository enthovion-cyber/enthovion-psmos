'use client';

import { CalendarDays, Clock, Edit3, Eye, Play, SquareCheckBig, XCircle } from 'lucide-react';
import type { HazopSession } from '../../types/hazop-session.types';
import { HazopSessionStatusBadge } from './HazopSessionStatusBadge';

export function HazopSessionSchedulePanel({ rows, loading, readonly, canEdit, canComplete, onOpen, onEdit, onStart, onComplete, onCancel }: { rows: HazopSession[]; loading?: boolean; readonly?: boolean; canEdit?: boolean; canComplete?: boolean; onOpen: (row: HazopSession) => void; onEdit: (row: HazopSession) => void; onStart: (row: HazopSession) => void; onComplete: (row: HazopSession) => void; onCancel: (row: HazopSession) => void }) {
  if (loading) return <section className="rounded-xl border border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">Loading HAZOP sessions...</section>;
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4"><h3 className="font-semibold">Session Schedule</h3><span className="text-xs text-[var(--psm-muted)]">{rows.length} sessions</span></div>
      <div className="grid gap-3 p-4">
        {rows.map((row) => (
          <article key={row.id} className="rounded-xl border border-[var(--psm-line)] p-4 hover:bg-[var(--psm-surface-2)]">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><button onClick={() => onOpen(row)} className="text-left text-lg font-semibold text-primary">S{row.session_number} · {row.title}</button><div className="mt-1 flex flex-wrap gap-3 text-xs text-[var(--psm-muted)]"><span><CalendarDays size={13} className="mr-1 inline" />{row.session_date ?? 'No date'}</span><span><Clock size={13} className="mr-1 inline" />{row.start_time ?? '--'} - {row.end_time ?? '--'}</span><span>{row.session_type}</span></div></div><HazopSessionStatusBadge value={row.status} /></div>
            <div className="mt-3 grid gap-2 text-sm md:grid-cols-4"><Metric label="Attendance" value={row.attendance_status ?? 'Not Started'} /><Metric label="Minutes" value={row.minutes_status ?? 'Missing'} /><Metric label="Actions" value={row.actions_status ?? 'No Actions'} /><Metric label="Nodes" value={row.plannedNodes?.length ?? row.planned_node_ids?.length ?? 0} /></div>
            <div className="mt-3 grid gap-2 text-xs text-[var(--psm-muted)] md:grid-cols-3">
              <div>Location: <span className="text-[var(--psm-text)]">{row.location ?? '-'}</span></div>
              <div>Facilitator: <span className="text-[var(--psm-text)]">{row.facilitator?.displayName ?? '-'}</span></div>
              <div>Scribe: <span className="text-[var(--psm-text)]">{row.scribe?.displayName ?? '-'}</span></div>
              <div className="md:col-span-3">Agenda: <span className="text-[var(--psm-text)]">{row.agenda ?? 'No agenda captured'}</span></div>
              {row.meeting_link ? <a className="text-primary" href={row.meeting_link} target="_blank">Open online meeting</a> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2"><Icon onClick={() => onOpen(row)}><Eye size={15} />View</Icon>{canEdit && !readonly ? <Icon onClick={() => onEdit(row)}><Edit3 size={15} />Edit</Icon> : null}{canEdit && !readonly && row.status === 'Planned' ? <Icon onClick={() => onStart(row)}><Play size={15} />Start</Icon> : null}{canComplete && !readonly && row.status !== 'Completed' ? <Icon onClick={() => onComplete(row)}><SquareCheckBig size={15} />Complete</Icon> : null}{canEdit && !readonly && !['Completed', 'Cancelled'].includes(row.status) ? <Icon danger onClick={() => onCancel(row)}><XCircle size={15} />Cancel</Icon> : null}</div>
          </article>
        ))}
        {!rows.length ? <div className="p-6 text-center text-sm text-[var(--psm-muted)]">No sessions match the current filters.</div> : null}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return <div className="rounded-lg border border-[var(--psm-line)] p-2"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="font-semibold">{value}</div></div>;
}

function Icon({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${danger ? 'border-red-500/30 text-red-300' : 'border-[var(--psm-line)]'}`}>{children}</button>;
}
