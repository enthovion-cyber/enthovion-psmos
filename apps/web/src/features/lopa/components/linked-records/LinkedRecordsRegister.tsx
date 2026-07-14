import { LinkedDataTable, LinkedStatusBadge } from './LinkedRecordUi';

export function LinkedRecordsRegister({ rows, onOpen, onSync, onRemove }: { rows: any[]; onOpen: (row: any) => void; onSync: (row: any) => void; onRemove: (row: any) => void }) {
  return <LinkedDataTable columns={['Record', 'Module', 'Relationship', 'Required', 'Blocking', 'Access', 'Changed', 'Last Sync', 'Actions']} empty="No linked records match the current filters." rows={rows.map((row) => (
    <tr key={row.id} className="text-slate-200">
      <td className="px-3 py-3"><button className="font-semibold text-white hover:text-blue-200" onClick={() => onOpen(row)}>{row.record_number ?? row.source_record_id}</button><div className="text-xs text-slate-500">{row.record_title ?? row.record_type}</div></td>
      <td className="px-3 py-3">{row.source_module}<div className="text-xs text-slate-500">{row.record_type}</div></td>
      <td className="px-3 py-3">{row.relationship_type}</td>
      <td className="px-3 py-3"><LinkedStatusBadge value={row.required ? 'Required' : 'Optional'} /></td>
      <td className="px-3 py-3"><LinkedStatusBadge value={row.blocking ? 'Blocking' : 'Non-blocking'} /></td>
      <td className="px-3 py-3"><LinkedStatusBadge value={row.access_status ?? 'Accessible'} /></td>
      <td className="px-3 py-3"><LinkedStatusBadge value={row.source_changed ? 'Source Changed' : 'Current'} /></td>
      <td className="px-3 py-3">{row.last_sync_at ?? '-'}</td>
      <td className="px-3 py-3"><div className="flex gap-2"><button className="text-blue-200" onClick={() => onSync(row)}>Sync</button><button className="text-red-200" onClick={() => onRemove(row)}>Remove</button></div></td>
    </tr>
  ))} />;
}
