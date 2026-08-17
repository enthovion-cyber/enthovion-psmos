import { AuditEmptyState } from "../shared/AuditUi";
import { AuditGapStatusBadge } from "../components/shared/AuditGapStatusBadge";
import { AuditCriticalityBadge } from "../components/shared/AuditCriticalityBadge";
export function AuditMappingGapTable({ rows }: { rows: Record<string, any>[] }) {
  if (!rows.length) return <AuditEmptyState title="No mapping gaps" message="No backend generated or manually created gaps are visible in this scope." />;
  return <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]"><table className="min-w-full divide-y divide-[var(--psm-line)] text-sm"><thead className="bg-[var(--psm-surface-2)]"><tr>{["Gap", "Type", "Severity", "Status", "Owner", "Due", "Fix"].map((head) => <th key={head} className="px-3 py-2 text-left font-semibold text-[var(--psm-muted)]">{head}</th>)}</tr></thead><tbody className="divide-y divide-[var(--psm-line)]">{rows.map((row) => <tr key={row.id}><td className="px-3 py-2 font-semibold">{row.gap_title}</td><td className="px-3 py-2">{row.gap_type}</td><td className="px-3 py-2"><AuditCriticalityBadge value={row.gap_severity} /></td><td className="px-3 py-2"><AuditGapStatusBadge value={row.gap_status} /></td><td className="px-3 py-2">{row.owner_user_id ?? "—"}</td><td className="px-3 py-2">{row.due_date ?? "—"}</td><td className="px-3 py-2">{row.recommended_fix ?? "—"}</td></tr>)}</tbody></table></div>;
}
