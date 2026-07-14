import type { HazopAttachment } from '../../types/hazop-attachment.types';
import { Panel } from './HazopAttachmentCategoryPanel';

export function HazopAttachmentLinkedRecordPanel({ rows }: { rows: HazopAttachment[] }) {
  const linked = rows.filter((row) => row.linked_node_id || row.linked_scenario_id || row.linked_recommendation_id || row.linked_safeguard_id || row.linked_session_id || row.linked_record_id);
  return <Panel title="Linked Sections / Records">{linked.slice(0, 8).map((row) => <div key={row.id} className="mb-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><div className="font-semibold">{row.file_name}</div><div className="text-[var(--psm-muted)]">{row.linked_section} · {row.linked_node_id ?? row.linked_scenario_id ?? row.linked_recommendation_id ?? row.linked_safeguard_id ?? row.linked_session_id ?? row.linked_record_id}</div></div>)}{!linked.length ? <p className="text-sm text-[var(--psm-muted)]">No attachments are linked to specific HAZOP records.</p> : null}</Panel>;
}
