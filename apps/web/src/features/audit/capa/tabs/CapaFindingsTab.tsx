"use client";
import type { AuditCapaDetail } from "../../types/audit-capa.types";
import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";

export function CapaFindingsTab({ detail }: { detail: AuditCapaDetail }) {
  return (
    <AuditCard title="Linked source finding(s)" subtitle="Finding links preserve company, site, program, plan, execution, severity, repeat-finding, and source-readiness context.">
      {detail.findings.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[.14em] text-[var(--psm-muted)]"><tr>{["Finding","Link type","Reason","Criticality","Linked by","Linked at"].map((h) => <th key={h} className="border-b border-[var(--psm-line)] p-3">{h}</th>)}</tr></thead>
            <tbody>{detail.findings.map((row) => <tr key={row.id} className="border-b border-[var(--psm-line)]"><td className="p-3 font-semibold">{row.finding_number ?? row.finding_id}</td><td className="p-3">{row.link_type ?? "-"}</td><td className="p-3">{row.link_reason ?? "-"}</td><td className="p-3">{row.criticality_snapshot ?? "-"}</td><td className="p-3">{row.linked_by ?? "-"}</td><td className="p-3">{row.linked_at ?? "-"}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <AuditEmptyState title="No linked findings" message="This CAPA has no backend source finding links in your permission scope." />}
    </AuditCard>
  );
}
