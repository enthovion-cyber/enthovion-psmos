import { AuditEmptyState } from "../shared/AuditUi";
import { AuditCoverageStatusBadge } from "../components/shared/AuditCoverageStatusBadge";
import { AuditCriticalityBadge } from "../components/shared/AuditCriticalityBadge";

export function AuditCoverageMatrixTable({ rows }: { rows: Record<string, any>[] }) {
  if (!rows.length) return <AuditEmptyState title="No coverage matrix rows" message="Add standard clauses and mappings to generate a backend coverage matrix." />;
  return <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]"><table className="min-w-full divide-y divide-[var(--psm-line)] text-sm"><thead className="bg-[var(--psm-surface-2)]"><tr>{["Clause", "Title", "Criticality", "Coverage", "Evidence", "Open gaps", "Mappings"].map((head) => <th key={head} className="px-3 py-2 text-left font-semibold text-[var(--psm-muted)]">{head}</th>)}</tr></thead><tbody className="divide-y divide-[var(--psm-line)]">{rows.map((row) => <tr key={row.clauseId}><td className="px-3 py-2 font-semibold">{row.clauseCode}</td><td className="px-3 py-2">{row.clauseTitle}</td><td className="px-3 py-2"><AuditCriticalityBadge value={row.criticality} /></td><td className="px-3 py-2"><AuditCoverageStatusBadge value={row.coverageStatus} /></td><td className="px-3 py-2">{row.evidenceStatus}</td><td className="px-3 py-2">{row.openGaps}</td><td className="px-3 py-2">{row.mappings?.length ?? 0}</td></tr>)}</tbody></table></div>;
}
