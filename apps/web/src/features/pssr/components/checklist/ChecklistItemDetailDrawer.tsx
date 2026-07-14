'use client';

import { X } from 'lucide-react';
import { Badge } from '../pssr-ui';

export function ChecklistItemDetailDrawer({ item, evidence, history, onClose }: { item: any | null; evidence: any[]; history: any[]; onClose: () => void }) {
  if (!item) return null;
  const files = evidence.filter((file) => file.checklist_item_id === item.id);
  const events = history.filter((event) => event.checklist_item_id === item.id);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55">
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-cyan-300/10 bg-[#061426] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Checklist Item</p><h3 className="mt-2 text-2xl font-black text-white">{item.item_title}</h3></div><button onClick={onClose} className="rounded-md border border-white/10 p-2 text-slate-200"><X size={18} /></button></div>
        <p className="mt-3 text-sm text-slate-400">{item.item_description ?? 'No full description recorded.'}</p>
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          <Info label="Requirement Source" value={item.source} />
          <Info label="Required Before Startup" value={item.required_before_startup ? 'Yes' : 'No'} />
          <Info label="Evidence Requirement" value={item.evidence_required ? 'Required' : 'Not Required'} />
          <Info label="Verification Requirement" value={item.verification_required ? 'Required' : 'Not Required'} />
          <Info label="Owner" value={item.owner_id ?? item.owner_role_id ?? '-'} />
          <Info label="Due Date" value={item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'} />
          <Info label="Related MOC" value={item.related_moc_id ?? '-'} />
          <Info label="Related Equipment" value={item.related_equipment_id ?? '-'} />
          <Info label="Related Document" value={item.related_document_id ?? '-'} />
          <Info label="Current Status" value={<Badge tone={item.status === 'Failed' ? 'red' : ['Completed', 'Verified'].includes(item.status) ? 'green' : 'amber'}>{item.status}</Badge>} />
        </div>
        <Section title="Evidence Files">{files.length ? files.map((file) => <div key={file.id} className="rounded-lg bg-white/[0.03] p-3 text-sm text-slate-300"><b className="text-white">{file.file_name}</b><p className="text-xs text-slate-500">{file.evidence_type} · {file.note ?? 'No note'}</p></div>) : <p className="text-sm text-slate-500">No evidence attached.</p>}</Section>
        <Section title="Comments & History">{events.length ? events.map((event) => <div key={event.id} className="rounded-lg bg-white/[0.03] p-3 text-sm text-slate-300"><b className="text-white">{event.title}</b><p className="text-xs text-slate-500">{event.created_at ? new Date(event.created_at).toLocaleString() : '-'}</p></div>) : <p className="text-sm text-slate-500">No item history yet.</p>}</Section>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return <div className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><div className="mt-1 text-sm font-bold text-slate-100">{value}</div></div>;
}

function Section({ title, children }: { title: string; children: any }) {
  return <section className="mt-5 rounded-xl border border-white/10 bg-slate-950/30 p-4"><h4 className="mb-3 text-sm font-black uppercase tracking-wide text-white">{title}</h4>{children}</section>;
}
