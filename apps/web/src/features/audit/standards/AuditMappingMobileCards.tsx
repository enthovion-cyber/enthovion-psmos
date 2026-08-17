import Link from "next/link";
import { AuditCoverageStatusBadge } from "../components/shared/AuditCoverageStatusBadge";
import { AuditMappingHealthBadge } from "../components/shared/AuditMappingHealthBadge";
import type { AuditStandardMapping } from "../types/audit-standard-mapping.types";

export function AuditMappingMobileCards({ rows }: { rows: AuditStandardMapping[] }) {
  return <div className="grid gap-3 lg:hidden">{rows.map((row) => <Link key={row.id} href={`/audit-compliance/standards-mapping/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
    <div className="font-semibold text-primary">{row.mapping_code}</div>
    <div className="text-sm text-[var(--psm-fg)]">{row.mapping_title}</div>
    <div className="mt-3 flex flex-wrap gap-2"><AuditCoverageStatusBadge value={row.coverage_status} /><AuditMappingHealthBadge value={row.mapping_health_status} /></div>
  </Link>)}</div>;
}
