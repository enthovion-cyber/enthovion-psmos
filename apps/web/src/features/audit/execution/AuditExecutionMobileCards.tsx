import Link from "next/link";
import { AuditEvidenceStatusBadge } from "../shared/AuditEvidenceStatusBadge";
import { AuditExecutionStatusBadge } from "../shared/AuditExecutionStatusBadge";
import type { AuditExecutionRow } from "../types/audit-execution.types";

export function AuditExecutionMobileCards({ rows }: { rows: AuditExecutionRow[] }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <Link key={row.id} href={`/audit-compliance/execution/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-primary">{row.execution_code}</p><p className="text-sm text-[var(--psm-fg)]">{row.execution_title}</p></div><AuditExecutionStatusBadge status={row.execution_status} /></div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--psm-muted)]"><AuditEvidenceStatusBadge status={row.evidence_status} /><span>{row.progress_percent}% complete</span><span>{row.field_findings_count} findings</span></div>
        </Link>
      ))}
    </div>
  );
}
