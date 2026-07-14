import { ExternalLink, MoreHorizontal, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import type { HazopLinkedRecord } from '../../types/hazop-linked-record.types';
import { HazopDependencyStatusBadge } from './HazopDependencyStatusBadge';
import { HazopLinkedRecordTypeBadge } from './HazopLinkedRecordTypeBadge';

export function HazopLinkedRecordsRegister({ records, readonly, canEdit, canDelete, onOpen, onSync, onDelete, onMarkBlocking }: { records: HazopLinkedRecord[]; readonly?: boolean; canEdit?: boolean; canDelete?: boolean; onOpen: (record: HazopLinkedRecord) => void; onSync: (record: HazopLinkedRecord) => void; onDelete: (record: HazopLinkedRecord) => void; onMarkBlocking: (record: HazopLinkedRecord) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4"><h3 className="font-semibold">Linked Record Register</h3><span className="text-xs text-[var(--psm-muted)]">{records.length} records</span></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="sticky top-0 bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>{['Type', 'Record', 'Relationship', 'Dependency', 'Blocking', 'Status', 'Last Sync', 'Actions'].map((head) => <th key={head} className="px-4 py-3 text-left">{head}</th>)}</tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]">
                <td className="px-4 py-3"><HazopLinkedRecordTypeBadge type={record.linked_module} /></td>
                <td className="px-4 py-3"><button onClick={() => onOpen(record)} className="text-left"><div className="font-semibold">{record.linked_record_number ?? record.linked_record_id}</div><div className="text-xs text-[var(--psm-muted)]">{record.restricted ? 'Restricted record' : record.linked_record_title ?? 'Untitled record'}</div></button></td>
                <td className="px-4 py-3">{record.relationship_type ?? '-'}</td>
                <td className="px-4 py-3">{record.dependency_direction ?? '-'}</td>
                <td className="px-4 py-3"><HazopDependencyStatusBadge value={record.blocking_status} /></td>
                <td className="px-4 py-3">{record.record_status ?? '-'}</td>
                <td className="px-4 py-3 text-xs text-[var(--psm-muted)]">{record.last_synced_at ? new Date(record.last_synced_at).toLocaleString() : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {record.url ? <a href={record.url} className="rounded-lg border border-[var(--psm-line)] p-2" title="Open record"><ExternalLink size={14} /></a> : null}
                    {canEdit && !readonly ? <button onClick={() => onSync(record)} className="rounded-lg border border-[var(--psm-line)] p-2" title="Sync"><RefreshCw size={14} /></button> : null}
                    {canEdit && !readonly ? <button onClick={() => onMarkBlocking(record)} className="rounded-lg border border-amber-500/30 p-2 text-amber-200" title="Mark blocking"><ShieldAlert size={14} /></button> : null}
                    {canDelete && !readonly ? <button onClick={() => onDelete(record)} className="rounded-lg border border-red-500/30 p-2 text-red-200" title="Remove"><Trash2 size={14} /></button> : null}
                    {!canEdit && !canDelete ? <MoreHorizontal size={14} className="text-[var(--psm-muted)]" /> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!records.length ? <div className="p-8 text-center text-sm text-[var(--psm-muted)]">No linked records match the current filters.</div> : null}
    </div>
  );
}
