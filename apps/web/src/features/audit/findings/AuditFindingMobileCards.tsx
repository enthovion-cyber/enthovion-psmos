import Link from "next/link";
import type { AuditFindingRow } from "../types/audit-finding.types";
import { AuditFindingCapaReadinessBadge } from "../shared/AuditFindingCapaReadinessBadge";
import { AuditFindingEvidenceStatusBadge } from "../shared/AuditFindingEvidenceStatusBadge";
import { AuditFindingPriorityBadge } from "../shared/AuditFindingPriorityBadge";
import { AuditFindingSeverityBadge } from "../shared/AuditFindingSeverityBadge";
import { AuditFindingStatusBadge } from "../shared/AuditFindingStatusBadge";

export function AuditFindingMobileCards({ rows }: { rows: AuditFindingRow[] }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <Link key={row.id} href={`/audit-compliance/findings/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">{row.finding_code}</p>
              <h3 className="mt-1 font-semibold text-[var(--psm-fg)]">{row.finding_title}</h3>
            </div>
            <AuditFindingStatusBadge value={row.finding_status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <AuditFindingSeverityBadge value={row.severity ?? row.criticality} />
            <AuditFindingPriorityBadge value={row.priority} />
            <AuditFindingEvidenceStatusBadge value={row.evidence_status} />
            <AuditFindingCapaReadinessBadge value={row.capa_readiness_status} />
          </div>
          <p className="mt-3 text-sm text-[var(--psm-muted)]">Owner: {row.owner?.name ?? row.owner_user_id ?? "Awaiting owner"} · Due: {row.due_date ?? "Not set"}</p>
        </Link>
      ))}
    </div>
  );
}
