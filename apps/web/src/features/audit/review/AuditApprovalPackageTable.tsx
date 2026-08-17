import Link from "next/link";
import { AuditApprovalStatusBadge } from "../shared/AuditApprovalStatusBadge";
import { AuditEsignatureStatusBadge } from "../shared/AuditEsignatureStatusBadge";
import { AuditSlaStatusBadge } from "../shared/AuditSlaStatusBadge";
import { AuditStalePackageBadge } from "../shared/AuditStalePackageBadge";
import { AuditValidationStatusBadge } from "../shared/AuditValidationStatusBadge";
import type { AuditApprovalPackage } from "../types/audit-review.types";

export function AuditApprovalPackageTable({ rows }: { rows: AuditApprovalPackage[] }) {
  return <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
    <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
      <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-[.14em] text-[var(--psm-muted)]">
        <tr>
          <th className="px-3 py-3">Package</th>
          <th className="px-3 py-3">Source</th>
          <th className="px-3 py-3">Status</th>
          <th className="px-3 py-3">Validation</th>
          <th className="px-3 py-3">Stale</th>
          <th className="px-3 py-3">E-sign</th>
          <th className="px-3 py-3">SLA</th>
          <th className="px-3 py-3">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--psm-line)]">
        {rows.map((row) => <tr key={row.id} className="align-top">
          <td className="px-3 py-3">
            <div className="font-semibold text-[var(--psm-fg)]">{row.package_title}</div>
            <div className="text-xs text-[var(--psm-muted)]">{row.package_number ?? row.id}</div>
          </td>
          <td className="px-3 py-3">
            <div>{row.source_module}</div>
            <div className="text-xs text-[var(--psm-muted)]">{row.source_record_number ?? row.source_record_title ?? row.source_record_id}</div>
          </td>
          <td className="px-3 py-3"><AuditApprovalStatusBadge status={row.package_status} /></td>
          <td className="px-3 py-3"><AuditValidationStatusBadge status={row.validation_status} /></td>
          <td className="px-3 py-3"><AuditStalePackageBadge status={row.stale_status} /></td>
          <td className="px-3 py-3"><AuditEsignatureStatusBadge required={row.e_signature_required} /></td>
          <td className="px-3 py-3"><AuditSlaStatusBadge overdue={row.overdue} /></td>
          <td className="px-3 py-3"><Link className="font-semibold text-primary" href={`/audit-compliance/review-approval/packages/${row.id}`}>Open</Link></td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}
