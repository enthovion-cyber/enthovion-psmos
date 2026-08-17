import Link from "next/link";
import type { AuditCapaRow } from "../types/audit-capa.types";
import { AuditCapaClosureReadinessBadge } from "../shared/AuditCapaClosureReadinessBadge";
import { AuditCapaStatusBadge } from "../shared/AuditCapaStatusBadge";

export function AuditCapaMobileCards({ rows }: { rows: AuditCapaRow[] }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <Link key={row.id} href={`/audit-compliance/capa/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm font-semibold text-primary">{row.capa_code}</p><h3 className="mt-1 font-semibold text-[var(--psm-fg)]">{row.capa_title}</h3></div>
            <AuditCapaStatusBadge value={row.capa_status} />
          </div>
          <div className="mt-3 grid gap-2 text-sm text-[var(--psm-muted)]">
            <span>Finding: {row.finding_code ?? row.primary_finding_id ?? "-"}</span>
            <span>Owner: {row.capa_owner_user_id ?? "Missing"}</span>
            <span>Actions: {row.open_actions ?? 0} open / {row.overdue_actions ?? 0} overdue</span>
            <AuditCapaClosureReadinessBadge value={row.closure_readiness_status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
