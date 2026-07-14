import type { HazopLinkedRecord } from '../../types/hazop-linked-record.types';
import { Panel } from './HazopLinkedRecordBlockerPanel';

export function HazopRelatedActionsPanel({ records }: { records: HazopLinkedRecord[] }) {
  const filtered = records.filter((record) => ['Universal Action', 'Action'].includes(record.linked_module ?? ''));
  return <Panel title="Related Actions">{filtered.map((record) => <div key={record.id} className="mb-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><div className="font-semibold">{record.linked_record_number ?? record.linked_record_title}</div><div className="text-[var(--psm-muted)]">{record.record_status ?? '-'}</div></div>)}{!filtered.length ? <p className="text-sm text-[var(--psm-muted)]">No Universal Actions linked from this tab.</p> : null}</Panel>;
}
