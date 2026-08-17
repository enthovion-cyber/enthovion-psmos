import type { AuditFindingDetail } from "../types/audit-finding.types";
import { AuditCard } from "../shared/AuditUi";

export function AuditFindingReadinessPanel({ detail }: { detail: AuditFindingDetail }) {
  const readiness = detail.readiness;
  return (
    <AuditCard title="Finding readiness / missing data" subtitle="Backend-generated blockers and warnings for confirmation and CAPA readiness.">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><p className="text-sm text-[var(--psm-muted)]">Readiness</p><p className="mt-2 text-xl font-bold text-[var(--psm-fg)]">{readiness.status}</p></div>
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><p className="text-sm text-[var(--psm-muted)]">Evidence</p><p className="mt-2 text-xl font-bold text-[var(--psm-fg)]">{readiness.evidenceStatus}</p></div>
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><p className="text-sm text-[var(--psm-muted)]">CAPA</p><p className="mt-2 text-xl font-bold text-[var(--psm-fg)]">{readiness.capaReadinessStatus}</p></div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <IssueList title="Blockers" rows={readiness.blockers} />
        <IssueList title="Warnings" rows={readiness.warnings} />
      </div>
    </AuditCard>
  );
}

function IssueList({ title, rows }: { title: string; rows: string[] }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><h3 className="font-semibold text-[var(--psm-fg)]">{title}</h3>{rows.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--psm-muted)]">{rows.map((row) => <li key={row}>{row}</li>)}</ul> : <p className="mt-2 text-sm text-emerald-600">None</p>}</div>;
}
