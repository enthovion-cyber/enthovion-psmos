import Link from "next/link";
import { AuditButton, AuditEmptyState } from "../shared/AuditUi";
import { AuditScoreCriticalBlockerBadge } from "../shared/AuditScoreCriticalBlockerBadge";
import { AuditScoreGradeBadge } from "../shared/AuditScoreGradeBadge";
import { AuditScoreReadinessBadge } from "../shared/AuditScoreReadinessBadge";
import { AuditScoreStaleBadge } from "../shared/AuditScoreStaleBadge";
import { AuditScoreStatusBadge } from "../shared/AuditScoreStatusBadge";
import type { AuditScoreRow } from "../types/audit-scoring.types";

export function AuditScoreTable({ rows }: { rows: AuditScoreRow[] }) {
  if (!rows.length) return <AuditEmptyState title="No compliance scores" message="No backend score runs match the current scope, filter, and permissions. Run a score from an audit execution, plan, program, finding, CAPA, evidence, site, unit, or area." action={<AuditButton href="/audit-compliance/scoring/runs/new">Run Score</AuditButton>} />;
  return <div className="hidden overflow-x-auto lg:block"><table className="min-w-[1600px] w-full text-left text-sm">
    <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]"><tr>{["Score", "Source", "Status", "Readiness", "Stale", "Final", "Original", "Adjusted", "Grade", "Blockers", "Calculated", "Actions"].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead>
    <tbody>{rows.map((row) => <tr key={row.id} className="border-b border-[var(--psm-line)] align-top">
      <td className="px-3 py-4"><Link className="font-semibold text-primary" href={`/audit-compliance/scoring/runs/${row.id}`}>{row.score_code ?? "No code"}</Link><p>{row.score_title ?? "Untitled score"}</p></td>
      <td className="px-3 py-4">{row.source_object_type ?? "-"}<p className="text-xs text-[var(--psm-muted)]">{row.source_object_id ?? "No source id"}</p></td>
      <td className="px-3 py-4"><AuditScoreStatusBadge value={row.score_status} /></td>
      <td className="px-3 py-4"><AuditScoreReadinessBadge value={row.readiness_status} /></td>
      <td className="px-3 py-4"><AuditScoreStaleBadge value={row.stale_status} /></td>
      <td className="px-3 py-4 text-lg font-bold">{row.final_score ?? "Not Determined"}</td>
      <td className="px-3 py-4">{row.original_calculated_score ?? "-"}</td>
      <td className="px-3 py-4">{row.adjusted_score ?? "-"}</td>
      <td className="px-3 py-4"><AuditScoreGradeBadge value={row.score_grade} /></td>
      <td className="px-3 py-4"><AuditScoreCriticalBlockerBadge count={Array.isArray(row.critical_blockers_json) ? row.critical_blockers_json.length : 0} /></td>
      <td className="px-3 py-4">{row.calculated_at ? new Date(row.calculated_at).toLocaleString() : "-"}</td>
      <td className="px-3 py-4"><div className="flex gap-2"><AuditButton href={`/audit-compliance/scoring/runs/${row.id}`} variant="secondary">View</AuditButton><AuditButton href={`/audit-compliance/scoring/runs/${row.id}/explainability`} variant="secondary">Why</AuditButton></div></td>
    </tr>)}</tbody>
  </table></div>;
}
