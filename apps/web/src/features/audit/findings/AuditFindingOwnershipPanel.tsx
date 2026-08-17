import type { AuditFindingDetail } from "../types/audit-finding.types";
import { AuditCard, AuditEmptyState } from "../shared/AuditUi";

export function AuditFindingOwnershipPanel({ detail }: { detail: AuditFindingDetail }) {
  const finding = detail.finding;
  return (
    <AuditCard title="Ownership / due date foundation" subtitle="Owner, reviewer, escalation owner, responsible department, due-date basis, SLA, and assignment history.">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <h3 className="font-semibold text-[var(--psm-fg)]">Current assignment</h3>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-[var(--psm-muted)]">Owner</dt><dd className="text-[var(--psm-fg)]">{finding.owner?.name ?? finding.owner_user_id ?? "Awaiting owner"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[var(--psm-muted)]">Reviewer</dt><dd className="text-[var(--psm-fg)]">{finding.reviewer_user_id ?? "Not set"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[var(--psm-muted)]">Due date</dt><dd className="text-[var(--psm-fg)]">{finding.due_date ?? "Not set"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[var(--psm-muted)]">Basis</dt><dd className="text-[var(--psm-fg)]">{finding.due_date_basis ?? "Not set"}</dd></div>
          </dl>
        </div>
        <div>{detail.ownership.length ? detail.ownership.map((row) => <div key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">{row.ownership_role}: {row.owner_user_id} · {row.status} · Due {row.due_date ?? "-"}</div>) : <AuditEmptyState title="No ownership records" message="Assignment records are created when owner/reviewer fields are saved." />}</div>
      </div>
    </AuditCard>
  );
}
