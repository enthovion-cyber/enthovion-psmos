import Link from "next/link";
import { AuditScoreGradeBadge } from "../shared/AuditScoreGradeBadge";
import { AuditScoreStatusBadge } from "../shared/AuditScoreStatusBadge";
import { AuditScoreStaleBadge } from "../shared/AuditScoreStaleBadge";
import type { AuditScoreRow } from "../types/audit-scoring.types";

export function AuditScoreMobileCards({ rows }: { rows: AuditScoreRow[] }) {
  return <div className="grid gap-3 lg:hidden">{rows.map((row) => <Link key={row.id} href={`/audit-compliance/scoring/runs/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
    <div className="flex items-start justify-between gap-3"><div><b>{row.score_code ?? "No code"}</b><p>{row.score_title ?? "Untitled score"}</p></div><AuditScoreGradeBadge value={row.score_grade} /></div>
    <div className="mt-3 flex flex-wrap gap-2"><AuditScoreStatusBadge value={row.score_status} /><AuditScoreStaleBadge value={row.stale_status} /><span className="text-xl font-bold">{row.final_score ?? "Not Determined"}</span></div>
  </Link>)}</div>;
}
