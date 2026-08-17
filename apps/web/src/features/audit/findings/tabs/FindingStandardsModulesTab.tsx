import type { AuditFindingDetail } from "../../types/audit-finding.types";
import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";

export function FindingStandardsModulesTab({ detail }: { detail: AuditFindingDetail }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <AuditCard title="Standards / regulation links">{detail.standards.length ? detail.standards.map((row) => <Record key={row.id} title={row.standard_name} meta={`${row.jurisdiction ?? "No jurisdiction"} · ${row.clause_reference ?? "No clause"}`} body={row.evidence_expectation ?? row.notes ?? "No evidence expectation."} />) : <AuditEmptyState title="No standards linked" message="Link a standard/regulation, clause, requirement category, and evidence expectation." />}</AuditCard>
      <AuditCard title="Module links">{detail.modules.length ? detail.modules.map((row) => <Record key={row.id} title={row.module_name} meta={`${row.module_key} · ${row.relationship_type}`} body={row.impact_description ?? row.related_record_title ?? "No impact description."} />) : <AuditEmptyState title="No module links" message="Link PTW, MOC, PSSR, PSI, MI, Incident/CAPA, Training, HAZOP, LOPA, Document Control, Equipment Registry, or custom module foundation records." />}</AuditCard>
    </div>
  );
}
function Record({ title, meta, body }: { title: string; meta: string; body: string }) {
  return <div className="mb-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><h3 className="font-semibold text-[var(--psm-fg)]">{title}</h3><p className="text-xs text-[var(--psm-muted)]">{meta}</p><p className="mt-2 text-sm text-[var(--psm-muted)]">{body}</p></div>;
}
