import Link from "next/link";
import { AuditStandardStatusBadge } from "../components/shared/AuditStandardStatusBadge";
export function AuditStandardMobileCards({ rows }: { rows: Record<string, any>[] }) {
  return <div className="grid gap-3 lg:hidden">{rows.map((row) => <Link key={row.id} href={`/audit-compliance/standards-mapping/standards/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="font-semibold text-primary">{row.standard_code}</div><div className="text-sm">{row.standard_name}</div><div className="mt-2"><AuditStandardStatusBadge value={row.standard_status} /></div></Link>)}</div>;
}
