import type { AuditFindingDetail } from "../../types/audit-finding.types";
import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";

export function FindingSourceTab({ detail }: { detail: AuditFindingDetail }) {
  return (
    <AuditCard title="Source traceability" subtitle="Primary source snapshot and links back to execution, response, field finding, field note, evidence review, interview, or walkthrough.">
      {detail.sources.length ? <div className="grid gap-3">{detail.sources.map((row) => <div key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><h3 className="font-semibold text-[var(--psm-fg)]">{row.source_type}</h3><p className="mt-2 text-sm text-[var(--psm-muted)]">{row.source_description ?? row.manual_source_reason ?? "No source description."}</p><dl className="mt-3 grid gap-1 text-sm text-[var(--psm-muted)] md:grid-cols-2"><div>Execution: {row.execution_id ?? "-"}</div><div>Response: {row.response_id ?? "-"}</div><div>Field finding: {row.field_finding_id ?? "-"}</div><div>Record: {row.source_record_id ?? "-"}</div></dl></div>)}</div> : <AuditEmptyState title="Source missing" message="The backend has no formal finding source link. Source is required by default settings before confirmation." />}
    </AuditCard>
  );
}
