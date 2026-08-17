import Link from "next/link";
import { AuditEmptyState } from "../shared/AuditUi";
import { AuditStandardStatusBadge } from "../components/shared/AuditStandardStatusBadge";

export function AuditStandardTable({ rows }: { rows: Record<string, any>[] }) {
  if (!rows.length) return <AuditEmptyState title="No standards configured" message="Add company/site standards before mapping audit objects to clauses." />;
  return <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]"><table className="min-w-full divide-y divide-[var(--psm-line)] text-sm"><thead className="bg-[var(--psm-surface-2)]"><tr>{["Code", "Name", "Type", "Jurisdiction", "Version", "Owner", "Status"].map((head) => <th key={head} className="px-3 py-2 text-left font-semibold text-[var(--psm-muted)]">{head}</th>)}</tr></thead><tbody className="divide-y divide-[var(--psm-line)]">{rows.map((row) => <tr key={row.id}><td className="px-3 py-2"><Link className="font-semibold text-primary" href={`/audit-compliance/standards-mapping/standards/${row.id}`}>{row.standard_code}</Link></td><td className="px-3 py-2">{row.standard_name}</td><td className="px-3 py-2">{row.standard_type}</td><td className="px-3 py-2">{row.jurisdiction ?? "—"}</td><td className="px-3 py-2">{row.version ?? "—"}</td><td className="px-3 py-2">{row.owner_user_id ?? "—"}</td><td className="px-3 py-2"><AuditStandardStatusBadge value={row.standard_status} /></td></tr>)}</tbody></table></div>;
}
