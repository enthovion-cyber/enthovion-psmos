import type { HazopLinkedRecord } from '../../types/hazop-linked-record.types';
import { Panel } from './HazopLinkedRecordBlockerPanel';

export function HazopMocPssrLopaLinkPanel({ records }: { records: HazopLinkedRecord[] }) {
  const filtered = records.filter((record) => ['MOC', 'PSSR', 'LOPA/SIL'].includes(record.linked_module ?? ''));
  return <Panel title="MOC / PSSR / LOPA Dependencies">{filtered.map((record) => <Mini key={record.id} record={record} />)}{!filtered.length ? <p className="text-sm text-[var(--psm-muted)]">No MOC, PSSR, or LOPA dependencies linked.</p> : null}</Panel>;
}

function Mini({ record }: { record: HazopLinkedRecord }) {
  return <div className="mb-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><div className="font-semibold">{record.linked_record_number ?? record.linked_record_id}</div><div className="text-[var(--psm-muted)]">{record.dependency_direction} · {record.record_status ?? '-'}</div></div>;
}
