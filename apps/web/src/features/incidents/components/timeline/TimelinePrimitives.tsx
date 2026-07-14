import { ReactNode } from 'react';
import { Field, InfoRows, SelectField, TabPanel, TextArea, ToggleGrid, formatDate } from '../shared/IncidentTabPrimitives';

export const timelinePhases = ['Pre-Event', 'Event Moment', 'Emergency Response', 'Post-Event Stabilization', 'Investigation Activity', 'Other'];
export const confidenceOptions = ['Confirmed', 'High', 'Medium', 'Low', 'Unknown'];
export const reliabilityOptions = ['System record', 'Direct witness', 'Photo/video evidence', 'Investigator estimate', 'Conflicting source', 'Unknown'];

export function DrawerShell({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-slate-950/60 p-3"><div className="ml-auto flex h-full max-w-2xl flex-col overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-cyan-300/10 dark:bg-[#071525]"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-black">{title}</h2><button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-cyan-300/10">Close</button></div>{children}</div></div>;
}

export function TimelineEventForm({ form, set }: { form: any; set: (key: string, value: any) => void }) {
  return <div className="grid gap-3 md:grid-cols-2"><Field label="Event time" type="datetime-local" value={form.eventTime} onChange={(v) => set('eventTime', v)} /><Field label="Event end time" type="datetime-local" value={form.eventTimeEnd} onChange={(v) => set('eventTimeEnd', v)} /><SelectField label="Phase" value={form.phase} options={timelinePhases} onChange={(v) => set('phase', v)} /><SelectField label="Confidence" value={form.confidence} options={confidenceOptions} onChange={(v) => set('confidence', v)} /><Field label="Title" value={form.title} onChange={(v) => set('title', v)} wide /><TextArea label="Description" value={form.description} onChange={(v) => set('description', v)} className="md:col-span-2" /><Field label="Location" value={form.location} onChange={(v) => set('location', v)} /><Field label="Involved people" value={form.involvedPeople} onChange={(v) => set('involvedPeople', v)} /><Field label="Evidence ID" value={form.relatedEvidenceId} onChange={(v) => set('relatedEvidenceId', v)} /><SelectField label="Source reliability" value={form.sourceReliability} options={reliabilityOptions} onChange={(v) => set('sourceReliability', v)} /><Field label="Source type" value={form.sourceType} onChange={(v) => set('sourceType', v)} /><Field label="Source reference" value={form.sourceReference} onChange={(v) => set('sourceReference', v)} /><div className="md:col-span-2"><ToggleGrid form={form} set={set} keys={[['gapFlag','Timeline gap'], ['conflictFlag','Timeline conflict']]} /></div><TextArea label="Notes / reason" value={form.notes ?? form.reason} onChange={(v) => set('notes', v)} className="md:col-span-2" /></div>;
}

export function RowCards({ rows, empty }: { rows?: any[]; empty: string }) {
  if (!rows?.length) return <p className="text-xs text-slate-500">{empty}</p>;
  return <div className="grid gap-2">{rows.map((row) => <div key={row.id ?? row.title} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10"><div className="font-bold">{row.title ?? row.event_title ?? row.gap_type ?? row.phase}</div><div className="text-slate-500">{formatDate(row.event_time ?? row.created_at)} · {row.phase ?? row.status ?? ''}</div><p className="mt-1 text-slate-500">{row.description ?? row.event_description ?? row.resolution_notes ?? ''}</p></div>)}</div>;
}

export function InfoPanel({ title, data, empty }: { title: string; data?: any; empty: string }) {
  const rows = data?.rows ?? [];
  return <TabPanel title={title}><RowCards rows={rows} empty={empty} /></TabPanel>;
}

export function ReviewBox({ review, onApprove, onReject }: any) {
  return <div className="grid gap-3"><InfoRows rows={[['Status', review?.status], ['Requested at', formatDate(review?.requestedAt)], ['Decision', review?.decision], ['Decided at', formatDate(review?.decidedAt)], ['Reason', review?.reason]]} /><div className="flex gap-2"><button onClick={onApprove} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white">Approve</button><button onClick={onReject} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-black text-red-600">Reject</button></div></div>;
}
