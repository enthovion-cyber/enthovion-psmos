import { X } from 'lucide-react';
import type { HazopLinkedRecord } from '../../types/hazop-linked-record.types';
import { HazopDependencyStatusBadge } from './HazopDependencyStatusBadge';
import { HazopLinkedRecordTypeBadge } from './HazopLinkedRecordTypeBadge';

export function HazopLinkedRecordDetailDrawer({ record, onClose }: { record: HazopLinkedRecord | null; onClose: () => void }) {
  if (!record) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <aside className="ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><div className="flex gap-2"><HazopLinkedRecordTypeBadge type={record.linked_module} /><HazopDependencyStatusBadge value={record.blocking_status} /></div><h3 className="mt-3 text-xl font-semibold">{record.linked_record_number ?? record.linked_record_id}</h3><p className="text-sm text-[var(--psm-muted)]">{record.linked_record_title}</p></div><button onClick={onClose}><X size={18} /></button></div>
        <Section title="Relationship & Dependency" rows={[['Relationship', record.relationship_type], ['Dependency', record.dependency_direction], ['Blocking rule', record.blocking_rule], ['Blocking status', record.blocking_status], ['Last sync', record.last_synced_at ? new Date(record.last_synced_at).toLocaleString() : '-']]} />
        <Section title="Record Details" rows={[['Status', record.record_status], ['Equipment tag', record.equipment_tag], ['Document version', record.document_version], ['Reason', record.link_reason], ['Notes', record.notes]]} />
        <section className="mt-4 rounded-xl border border-[var(--psm-line)] p-4"><h4 className="font-semibold">Blockers</h4>{(record.blockers ?? []).map((blocker) => <div key={blocker.id} className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm"><div className="font-semibold text-red-200">{blocker.blocker_type}</div><p className="mt-1 text-[var(--psm-muted)]">{blocker.blocker_description}</p></div>)}{!(record.blockers ?? []).length ? <p className="mt-3 text-sm text-[var(--psm-muted)]">No active blockers for this relationship.</p> : null}</section>
      </aside>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: [string, any][] }) {
  return <section className="mt-4 rounded-xl border border-[var(--psm-line)] p-4"><h4 className="mb-3 font-semibold">{title}</h4>{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-t border-[var(--psm-line)] py-2 text-sm first:border-t-0"><span className="text-[var(--psm-muted)]">{label}</span><span className="text-right">{value ?? '-'}</span></div>)}</section>;
}
