import Link from "next/link";
import type { ChecklistRow } from "../types/audit-checklist.types";
import { AuditChecklistStatusBadge } from "../shared/AuditChecklistStatusBadge";
import { AuditChecklistReadinessBadge } from "../shared/AuditChecklistReadinessBadge";
import { AuditChecklistVersionBadge } from "../shared/AuditChecklistVersionBadge";
export function AuditChecklistTemplateTable({
  rows,
}: {
  rows: ChecklistRow[];
}) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] lg:block">
      <table className="min-w-[1500px] w-full text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase text-[var(--psm-muted)]">
          <tr>
            {[
              "Code / Title",
              "Template Type",
              "Audit Type",
              "Scope",
              "Standards / Modules",
              "Sections / Items",
              "Mandatory / Critical",
              "Status",
              "Version",
              "Owner",
              "Review Due",
              "Readiness",
              "Actions",
            ].map((x) => (
              <th key={x} className="p-3">
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[var(--psm-line)]">
              <td className="p-3">
                <Link
                  className="font-semibold text-primary"
                  href={`/audit-compliance/checklists/templates/${r.id}`}
                >
                  {r.checklist_code}
                </Link>
                <p>{r.checklist_title}</p>
              </td>
              <td className="p-3">{r.template_type}</td>
              <td className="p-3">{r.audit_type}</td>
              <td className="p-3">
                {r.site_id ? "Site scoped" : "Company wide"}
              </td>
              <td className="p-3">
                {r.standards_count} / {r.modules_count}
              </td>
              <td className="p-3">
                {r.sections_count} / {r.items_count}
              </td>
              <td className="p-3">
                {r.mandatory_items} / {r.safety_critical_items}
              </td>
              <td className="p-3">
                <AuditChecklistStatusBadge value={r.checklist_status} />
              </td>
              <td className="p-3">
                <AuditChecklistVersionBadge
                  value={r.version}
                  current={r.current_version}
                />
              </td>
              <td className="p-3">{r.owner_user_id ?? "Missing"}</td>
              <td className="p-3">{r.next_review_due ?? "Missing"}</td>
              <td className="p-3">
                <AuditChecklistReadinessBadge value={r.readiness_health} />
              </td>
              <td className="p-3">
                <Link
                  href={`/audit-compliance/checklists/builder/${r.id}`}
                  className="font-semibold text-primary"
                >
                  Open Builder
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
