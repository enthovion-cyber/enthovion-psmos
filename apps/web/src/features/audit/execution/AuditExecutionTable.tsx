import Link from "next/link";
import { AuditEvidenceStatusBadge } from "../shared/AuditEvidenceStatusBadge";
import { AuditExecutionProgressBadge } from "../shared/AuditExecutionProgressBadge";
import { AuditExecutionStatusBadge } from "../shared/AuditExecutionStatusBadge";
import type { AuditExecutionRow } from "../types/audit-execution.types";

export function AuditExecutionTable({ rows }: { rows: AuditExecutionRow[] }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[.14em] text-[var(--psm-muted)]">
          <tr className="border-b border-[var(--psm-line)]">
            <th className="py-3 pr-4">Execution</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4">Progress</th>
            <th className="py-3 pr-4">Evidence</th>
            <th className="py-3 pr-4">Findings</th>
            <th className="py-3 pr-4">Lead</th>
            <th className="py-3 pr-4">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-[var(--psm-line)] align-top">
              <td className="py-3 pr-4"><Link className="font-semibold text-primary hover:underline" href={`/audit-compliance/execution/${row.id}`}>{row.execution_code}</Link><p className="text-[var(--psm-muted)]">{row.execution_title}</p></td>
              <td className="py-3 pr-4"><AuditExecutionStatusBadge status={row.execution_status} /></td>
              <td className="py-3 pr-4"><AuditExecutionProgressBadge value={row.progress_percent} /><p className="mt-1 text-xs text-[var(--psm-muted)]">{row.completed_items}/{row.total_items} answered</p></td>
              <td className="py-3 pr-4"><AuditEvidenceStatusBadge status={row.evidence_status} /><p className="mt-1 text-xs text-[var(--psm-muted)]">{row.evidence_missing_count} missing</p></td>
              <td className="py-3 pr-4"><span className="font-semibold text-[var(--psm-fg)]">{row.field_findings_count}</span><p className="text-xs text-danger">{row.critical_findings_count} critical</p></td>
              <td className="py-3 pr-4 text-[var(--psm-muted)]">{row.lead_auditor_user_id ?? "Unassigned"}</td>
              <td className="py-3 pr-4 text-[var(--psm-muted)]">{row.updated_at ? new Date(row.updated_at).toLocaleString() : "Not updated"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
