import type { HazopLinkedRecord } from '../../types/hazop-linked-record.types';
import { Panel } from './HazopLinkedRecordBlockerPanel';

export function HazopEquipmentDocumentLinkPanel({ records }: { records: HazopLinkedRecord[] }) {
  const filtered = records.filter((record) => ['Equipment', 'Document', 'P&ID', 'SOP'].includes(record.linked_module ?? ''));
  return <Panel title="Equipment / Documents">{filtered.map((record) => <div key={record.id} className="mb-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><div className="font-semibold">{record.linked_record_title ?? record.linked_record_number}</div><div className="text-[var(--psm-muted)]">{record.linked_module} · {record.equipment_tag ?? record.document_version ?? record.record_status ?? '-'}</div></div>)}{!filtered.length ? <p className="text-sm text-[var(--psm-muted)]">No equipment or document records linked.</p> : null}</Panel>;
}
