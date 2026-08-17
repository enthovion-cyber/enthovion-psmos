import Link from "next/link";
import type { AuditFindingRow } from "../types/audit-finding.types";
import { AuditFindingCapaReadinessBadge } from "../shared/AuditFindingCapaReadinessBadge";
import { AuditFindingDuplicateBadge } from "../shared/AuditFindingDuplicateBadge";
import { AuditFindingEvidenceStatusBadge } from "../shared/AuditFindingEvidenceStatusBadge";
import { AuditFindingOverdueBadge } from "../shared/AuditFindingOverdueBadge";
import { AuditFindingSeverityBadge } from "../shared/AuditFindingSeverityBadge";
import { AuditFindingStatusBadge } from "../shared/AuditFindingStatusBadge";
import { AuditFindingTypeBadge } from "../shared/AuditFindingTypeBadge";

export function AuditFindingTable({ rows }: { rows: AuditFindingRow[] }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="min-w-[1280px] w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[.14em] text-[var(--psm-muted)]">
          <tr className="border-b border-[var(--psm-line)]">
            {["Finding Code", "Finding Title", "Source", "Audit Execution", "Audit Plan", "Scope", "Standard / Clause", "Module", "Finding Type", "Severity", "Criticality", "Owner", "Due Date", "Status", "Repeat", "Evidence", "CAPA Readiness", "Actions"].map((head) => <th key={head} className="px-3 py-3 font-semibold">{head}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-[var(--psm-line)] align-top hover:bg-[var(--psm-surface-2)]">
              <td className="px-3 py-3 font-semibold text-primary"><Link href={`/audit-compliance/findings/${row.id}`}>{row.finding_code}</Link></td>
              <td className="px-3 py-3"><div className="font-semibold text-[var(--psm-fg)]">{row.finding_title}</div><div className="line-clamp-2 text-xs text-[var(--psm-muted)]">{row.finding_description ?? "No description yet"}</div></td>
              <td className="px-3 py-3">{row.execution_id ? "Audit Execution" : "Manual / Foundation"}</td>
              <td className="px-3 py-3">{row.execution_id ?? "-"}</td>
              <td className="px-3 py-3">{row.plan_id ?? "-"}</td>
              <td className="px-3 py-3">{[row.site_id, row.unit_id, row.area_id].filter(Boolean).join(" / ") || "Company-wide"}</td>
              <td className="px-3 py-3">Linked in detail</td>
              <td className="px-3 py-3">Linked in detail</td>
              <td className="px-3 py-3"><AuditFindingTypeBadge value={row.finding_type} /></td>
              <td className="px-3 py-3"><AuditFindingSeverityBadge value={row.severity} /></td>
              <td className="px-3 py-3"><AuditFindingSeverityBadge value={row.criticality} /></td>
              <td className="px-3 py-3">{row.owner?.name ?? row.owner_user_id ?? "Awaiting owner"}</td>
              <td className="px-3 py-3"><div>{row.due_date ?? "Not set"}</div><AuditFindingOverdueBadge overdue={row.overdue} /></td>
              <td className="px-3 py-3"><AuditFindingStatusBadge value={row.finding_status} /></td>
              <td className="px-3 py-3"><AuditFindingDuplicateBadge value={row.duplicate_repeat_status} /></td>
              <td className="px-3 py-3"><AuditFindingEvidenceStatusBadge value={row.evidence_status} /></td>
              <td className="px-3 py-3"><AuditFindingCapaReadinessBadge value={row.capa_readiness_status} /></td>
              <td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Link className="text-primary hover:underline" href={`/audit-compliance/findings/${row.id}`}>View</Link><Link className="text-primary hover:underline" href={`/audit-compliance/findings/${row.id}/edit`}>Edit</Link></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
