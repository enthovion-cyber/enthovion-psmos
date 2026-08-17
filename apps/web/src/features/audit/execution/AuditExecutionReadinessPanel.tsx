import { AuditCard } from "../shared/AuditUi";
import type { AuditExecutionReadiness } from "../types/audit-execution.types";

export function AuditExecutionReadinessPanel({ readiness }: { readiness?: AuditExecutionReadiness | null }) {
  return <AuditCard title="Execution Readiness">{readiness?.missing_items_json?.length ? <ul className="space-y-1 text-sm text-danger">{readiness.missing_items_json.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="text-sm text-[var(--psm-muted)]">No readiness blockers returned.</p>}</AuditCard>;
}
