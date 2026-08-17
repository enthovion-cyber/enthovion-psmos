import type { AuditFindingDetail } from "../../types/audit-finding.types";
import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";

export function FindingLinkedRecordsTab({ detail }: { detail: AuditFindingDetail }) {
  return <AuditCard title="Linked records foundation" subtitle="Module links are safe foundation links only and do not mutate PTW/MOC/PSSR/PSI/MI/Incident/Training/Document Control records.">{detail.modules.length ? detail.modules.map((row) => <div key={row.id} className="mb-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">{row.module_name}: {row.related_record_title ?? row.related_record_id ?? "No linked record"} · {row.integration_status ?? "Foundation"}</div>) : <AuditEmptyState title="No linked records" message="Add module links from the standards/modules section or API." />}</AuditCard>;
}
