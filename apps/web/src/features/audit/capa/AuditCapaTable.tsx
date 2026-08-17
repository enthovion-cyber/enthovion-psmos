import Link from "next/link";
import type { AuditCapaRow } from "../types/audit-capa.types";
import { AuditCapaActionStatusBadge } from "../shared/AuditCapaActionStatusBadge";
import { AuditCapaClosureReadinessBadge } from "../shared/AuditCapaClosureReadinessBadge";
import { AuditCapaEffectivenessStatusBadge } from "../shared/AuditCapaEffectivenessStatusBadge";
import { AuditCapaOverdueBadge } from "../shared/AuditCapaOverdueBadge";
import { AuditCapaPriorityBadge } from "../shared/AuditCapaPriorityBadge";
import { AuditCapaStatusBadge } from "../shared/AuditCapaStatusBadge";
import { AuditCapaVerificationStatusBadge } from "../shared/AuditCapaVerificationStatusBadge";

export function AuditCapaTable({ rows }: { rows: AuditCapaRow[] }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="min-w-[1350px] w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[.14em] text-[var(--psm-muted)]">
          <tr>{["CAPA Code","CAPA Title","Source Finding","Audit Execution / Plan","Scope","Severity","CAPA Status","Corrective","Preventive","Containment","Open","Overdue","Owner","Due Date","Verification","Effectiveness","Closure","Actions"].map((h) => <th key={h} className="border-b border-[var(--psm-line)] p-3">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-[var(--psm-line)] align-top">
              <td className="p-3 font-semibold text-primary"><Link href={`/audit-compliance/capa/${row.id}`}>{row.capa_code}</Link></td>
              <td className="p-3 text-[var(--psm-fg)]">{row.capa_title}</td>
              <td className="p-3">{row.finding_code ?? row.primary_finding_id ?? "-"}</td>
              <td className="p-3">{row.execution_id ?? row.plan_id ?? "-"}</td>
              <td className="p-3">{[row.site_id,row.unit_id,row.area_id].filter(Boolean).join(" / ") || "Company"}</td>
              <td className="p-3">{row.finding_severity ?? row.criticality ?? "-"}</td>
              <td className="p-3"><AuditCapaStatusBadge value={row.capa_status} /></td>
              <td className="p-3">{row.corrective_actions ?? 0}</td>
              <td className="p-3">{row.preventive_actions ?? 0}</td>
              <td className="p-3">{row.containment_actions ?? 0}</td>
              <td className="p-3"><AuditCapaActionStatusBadge value={`${row.open_actions ?? 0} open`} /></td>
              <td className="p-3"><AuditCapaOverdueBadge count={row.overdue_actions ?? 0} /></td>
              <td className="p-3">{row.capa_owner_user_id ?? "Missing"}</td>
              <td className="p-3">{row.overall_due_date ?? "-"}</td>
              <td className="p-3"><AuditCapaVerificationStatusBadge value={row.verification_status} /></td>
              <td className="p-3"><AuditCapaEffectivenessStatusBadge value={row.effectiveness_status} /></td>
              <td className="p-3"><AuditCapaClosureReadinessBadge value={row.closure_readiness_status} /></td>
              <td className="p-3"><div className="flex flex-wrap gap-2"><Link className="text-primary" href={`/audit-compliance/capa/${row.id}`}>View</Link><Link className="text-primary" href={`/audit-compliance/capa/${row.id}/edit`}>Edit</Link><Link className="text-primary" href={`/audit-compliance/capa/${row.id}/actions`}>Actions</Link><Link className="text-primary" href={`/audit-compliance/capa/${row.id}/history`}>History</Link></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
