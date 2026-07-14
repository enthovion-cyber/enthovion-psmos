import { DetailRow, LibraryDrawer } from '../libraries/LibraryShared';
import { LinkedStatusBadge } from './LinkedRecordUi';

export function LinkedRecordDetailDrawer({ row, onClose, onSync, onCompare }: { row: any; onClose: () => void; onSync: (row: any) => void; onCompare: (row: any) => void }) {
  return (
    <LibraryDrawer title="Linked Record Detail" open={!!row} onClose={onClose}>
      {row ? <div className="space-y-4">
        <div className="flex flex-wrap gap-2"><LinkedStatusBadge value={row.access_status ?? 'Accessible'} /><LinkedStatusBadge value={row.source_changed ? 'Source Changed' : 'Current'} /><LinkedStatusBadge value={row.blocking ? 'Blocking' : 'Non-blocking'} /></div>
        <div className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-3">
          <DetailRow label="Record" value={row.record_number ?? row.source_record_id} />
          <DetailRow label="Title" value={row.record_title} />
          <DetailRow label="Module" value={row.source_module} />
          <DetailRow label="Relationship" value={row.relationship_type} />
          <DetailRow label="Required" value={row.required ? 'Yes' : 'No'} />
          <DetailRow label="Impact" value={row.impact_level} />
          <DetailRow label="Last sync" value={row.last_sync_at ?? '-'} />
          <DetailRow label="Notes" value={row.notes} />
        </div>
        <div className="grid grid-cols-2 gap-2"><button className="lopa-button-secondary" onClick={() => onSync(row)}>Sync Snapshot</button><button className="lopa-button-secondary" onClick={() => onCompare(row)}>Compare Source</button></div>
      </div> : null}
    </LibraryDrawer>
  );
}
