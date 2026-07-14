'use client';

import { useEffect, useState } from 'react';
import type { HazopSession } from '../../types/hazop-session.types';

export function AddEditSessionDialog({ open, session, context, saving, onClose, onSave }: { open: boolean; session?: HazopSession | undefined; context?: any; saving?: boolean; onClose: () => void; onSave: (values: Record<string, any>) => void }) {
  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => { if (open) setForm(session ? { title: session.title, sessionType: session.session_type, description: session.description, sessionDate: session.session_date, startTime: session.start_time, endTime: session.end_time, location: session.location, meetingLink: session.meeting_link, facilitatorId: session.facilitator_id, scribeId: session.scribe_id, plannedNodeIds: session.planned_node_ids ?? [], agenda: session.agenda, status: session.status } : { sessionType: 'HAZOP worksheet session', status: 'Planned', plannedNodeIds: [] }); }, [open, session]);
  if (!open) return null;
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const toggleNode = (id: string) => set('plannedNodeIds', (form.plannedNodeIds ?? []).includes(id) ? form.plannedNodeIds.filter((x: string) => x !== id) : [...(form.plannedNodeIds ?? []), id]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--psm-line)] p-5"><div><h3 className="text-xl font-semibold">{session ? 'Edit Session' : 'Add Session'}</h3><p className="text-sm text-[var(--psm-muted)]">Schedule, agenda, planned nodes, facilitator, and scribe.</p></div><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-3 py-2">Close</button></div>
        <div className="grid gap-4 p-5 md:grid-cols-2"><Field label="Title"><input className="input" value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} /></Field><Field label="Session type"><select className="input" value={form.sessionType ?? ''} onChange={(e) => set('sessionType', e.target.value)}>{(context?.sessionTypes ?? []).map((x: string) => <option key={x}>{x}</option>)}</select></Field><Field label="Status"><select className="input" value={form.status ?? 'Planned'} onChange={(e) => set('status', e.target.value)}>{['Planned', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled', 'Missed'].map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Date"><input type="date" className="input" value={form.sessionDate ?? ''} onChange={(e) => set('sessionDate', e.target.value)} /></Field><Field label="Time"><div className="grid grid-cols-2 gap-2"><input type="time" className="input" value={form.startTime ?? ''} onChange={(e) => set('startTime', e.target.value)} /><input type="time" className="input" value={form.endTime ?? ''} onChange={(e) => set('endTime', e.target.value)} /></div></Field><Field label="Location"><input className="input" value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} /></Field><Field label="Online meeting"><input className="input" value={form.meetingLink ?? ''} onChange={(e) => set('meetingLink', e.target.value)} /></Field><Field label="Facilitator"><UserSelect users={context?.users ?? []} value={form.facilitatorId} onChange={(v) => set('facilitatorId', v)} /></Field><Field label="Scribe"><UserSelect users={context?.users ?? []} value={form.scribeId} onChange={(v) => set('scribeId', v)} /></Field><Field label="Description"><textarea className="input min-h-24" value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} /></Field><Field label="Agenda"><textarea className="input min-h-24" value={form.agenda ?? ''} onChange={(e) => set('agenda', e.target.value)} /></Field></div>
        <section className="px-5 pb-5"><h4 className="mb-2 text-sm font-semibold">Planned Nodes</h4><div className="grid gap-2 md:grid-cols-2">{(context?.nodes ?? []).map((node: any) => <label key={node.id} className="flex items-center gap-3 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><input type="checkbox" checked={(form.plannedNodeIds ?? []).includes(node.id)} onChange={() => toggleNode(node.id)} />{node.node_number} {node.title}</label>)}</div></section>
        <div className="flex justify-end gap-3 border-t border-[var(--psm-line)] p-5"><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-4 py-2">Cancel</button><button disabled={saving} onClick={() => onSave(form)} className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save Session'}</button></div>
      </div>
    </div>
  );
}

function UserSelect({ users, value, onChange }: { users: any[]; value?: string; onChange: (value: string) => void }) {
  return <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}><option value="">Unassigned</option>{users.map((u) => <option key={u.id} value={u.id}>{u.displayName}</option>)}</select>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1 text-sm"><span className="text-[var(--psm-muted)]">{label}</span>{children}</label>;
}
