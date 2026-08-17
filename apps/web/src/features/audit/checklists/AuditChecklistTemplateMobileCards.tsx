import Link from "next/link";
import type { ChecklistRow } from "../types/audit-checklist.types";
import { AuditChecklistStatusBadge } from "../shared/AuditChecklistStatusBadge";
export function AuditChecklistTemplateMobileCards({
  rows,
}: {
  rows: ChecklistRow[];
}) {
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((r) => (
        <article
          key={r.id}
          className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"
        >
          <div className="flex justify-between gap-3">
            <Link
              href={`/audit-compliance/checklists/templates/${r.id}`}
              className="font-semibold text-primary"
            >
              {r.checklist_code}
            </Link>
            <AuditChecklistStatusBadge value={r.checklist_status} />
          </div>
          <h3 className="mt-2 font-semibold">{r.checklist_title}</h3>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">
            {r.sections_count} sections · {r.items_count} items · v{r.version}
          </p>
        </article>
      ))}
    </div>
  );
}
